'use client';

import { useState, useRef, useEffect } from 'react';
import { api, bufferToImageUrl, getUserData, processResultsData, getResultsData, processCleanedResults } from '@/lib/api';
import { GameCenter } from '../components/games';

// Then in your tab rendering:

// Types
interface StudentInfo {
  id: number;
  MatNo: string;
  Surname: string;
  FirstName: string;
  MiddleName: string;
  SexName: string;
  StudentImage: {
    type: string;
    data: number[];
  };
  FullName: string;
  Email: string;
  Telephone: string;
  FacultyID: number;
  DepartmentID: number;
  ELDS: string;
  DoB: string;
  HomeAddress: string;
  CountryID: number;
  StateID: number;
  SessionID: number;
  LevelID: number;
}

interface FacultyData {
  status: boolean;
  message: string;
  payload: {
    id: number;
    FacultyName: string;
    SubscriberID: string;
  };
}

interface DepartmentData {
  status: boolean;
  message: string;
  payload: {
    id: number;
    DepartmentName: string;
    SubscriberID: string;
  };
}

// Common interface for both result types
interface BaseResultsData {
  gradeClass: {
    class: string;
    color: string;
  };
  failedCourses: any[];
}

interface ResultsData extends BaseResultsData {
  resultsByLevel: any;
  gpaData: any;
  cgpa: string;
}

interface CleanedResultsData extends BaseResultsData {
  studentInfo: {
    studentId: number;
    matricNumber: string;
  };
  overall: {
    cgpa: number;
    totalCredits: number;
    totalGradePoints: number;
  };
  semesters: Array<{
    semester: string;
    session: string;
    level: string;
    gpa: number;
    totalCredits: number;
    courses: Array<{
      courseCode: string;
      courseName: string;
      grade: string;
      gradePoint: number;
      creditUnit: number;
      totalScore: number;
      semester: string;
      session: string;
      level: string;
      status: string;
    }>;
  }>;
  resultsByLevel: any;
  rawData: any;
}

interface SimpleResultsData extends BaseResultsData {
  studentInfo: {
    matricNumber: string;
    totalCourses: number;
    totalCredits: number;
    cgpa: number;
  };
  resultsBySession: any;
  allResults: any[];
}

type AllResultsData = ResultsData | CleanedResultsData | SimpleResultsData;

interface CurrentData {
  name: string;
  matricNo: string;
  faculty: string;
  department: string;
  email: string;
  phone: string;
  session: string;
  level: string;
  cgpa: string;
  grade: string;
  gender: string;
  dob: string;
  address: string;
  imageUrl: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('primary');
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  // const [resultsData, setResultsData] = useState<AllResultsData | null>(null);
  const [resultsData, setResultsData] = useState<any>(null);
  const [facultyData, setFacultyData] = useState<FacultyData | null>(null);
  const [departmentData, setDepartmentData] = useState<DepartmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [useCleanApi, setUseCleanApi] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Helper function to get level name from LevelID
  const getLevelName = (levelId: number) => {
    const levels: { [key: number]: string } = {
      12: "100 Level",
      11: "200 Level", 
      10: "300 Level",
      9: "400 Level",
      8: "500 Level"
    };
    return levels[levelId] || `Level ${levelId}`;
  };

  // Helper function to get session name from SessionID
  const getSessionName = (sessionId: number) => {
    const sessions: { [key: number]: string } = {
      33: "2023/2024",
      34: "2024/2025",
      35: "2025/2026"
    };
    return sessions[sessionId] || `Session ${sessionId}`;
  };

  // Helper function to get CGPA from results data
  const getCgpaFromResults = (data: AllResultsData | null): string => {
    if (!data) return "3.38";
    
    // Check if it's cleaned results data
    if ('overall' in data) {
      return data.overall.cgpa.toFixed(2);
    }
    
    // Check if it's simple results data
    if ('studentInfo' in data && 'cgpa' in data.studentInfo) {
      return data.studentInfo.cgpa.toFixed(2);
    }
    
    // It's original results data
    return (data as ResultsData).cgpa;
  };

  // Helper function to get grade class from results data
  const getGradeClassFromResults = (data: AllResultsData | null) => {
    if (!data) return { class: "Second Class Lower", color: "from-purple-400 to-indigo-500" };
    return data.gradeClass;
  };

  // Compute currentData from state
  const userData = getUserData();
  const currentData: CurrentData = {
    name: studentInfo?.FullName || userData?.FullName || "Test User",
    matricNo: studentInfo?.MatNo || userData?.MatNo || "U/***/***",
    faculty: facultyData?.payload?.FacultyName || "NATURAL AND APPLIED SCIENCES",
    department: departmentData?.payload?.DepartmentName || studentInfo?.ELDS || "COMPUTER SCIENCE",
    email: studentInfo?.Email || userData?.Email || "RandomGmail.com",
    phone: studentInfo?.Telephone || userData?.Telephone || "+234*******",
    session: getSessionName(studentInfo?.SessionID || userData?.SessionID || 34),
    level: getLevelName(studentInfo?.LevelID || userData?.LevelID || 10),
    cgpa: getCgpaFromResults(resultsData),
    grade: getGradeClassFromResults(resultsData).class,
    gender: studentInfo?.SexName || "MALE",
    dob: studentInfo?.DoB ? new Date(studentInfo.DoB).toLocaleDateString() : "Jun 20, 2005",
    address: studentInfo?.HomeAddress || "PORT HARCOURT",
    imageUrl: studentInfo?.StudentImage ? bufferToImageUrl(studentInfo.StudentImage.data) : ''
  };

  // Fetch all student data on component mount
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setIsLoading(true);
        const userData = getUserData();
        
        if (userData && userData.UIN) {
          console.log('Fetching student data for:', userData.UIN);
          
          // Fetch student info
          try {
            const studentInfoData = await api.getStudentInfo(userData.UIN);
            setStudentInfo(studentInfoData);
          } catch (studentError) {
            console.error('Failed to fetch student info:', studentError);
            throw new Error('Unable to load student profile information');
          }

          // Fetch faculty and department names in parallel with better error handling
          try {
            const facultyResponse = await api.getFaculty(userData.FacultyID);
            if (facultyResponse.status && facultyResponse.payload) {
              setFacultyData(facultyResponse);
            }
          } catch (facultyError) {
            console.warn('Failed to fetch faculty data:', facultyError);
            // Use default faculty name from currentData
          }

          try {
            const departmentResponse = await api.getDepartment(userData.DepartmentID);
            if (departmentResponse.status && departmentResponse.payload) {
              setDepartmentData(departmentResponse);
            }
          } catch (departmentError) {
            console.warn('Failed to fetch department data:', departmentError);
            // Use default department name from currentData
          }

          // Fetch results data with error handling - using the new clean API
          try {
            console.log('Fetching results using clean API...');
            const results = await getResultsData(userData.id, useCleanApi);
            setResultsData(results as AllResultsData);
          } catch (resultsError) {
            console.warn('Failed to fetch results data:', resultsError);
            // Try fallback to old API
            try {
              console.log('Trying fallback to original API...');
              const resultsData = await api.getStudentResults(userData.id);
              const processedResults = processResultsData(resultsData);
              setResultsData(processedResults as AllResultsData);
              setUseCleanApi(false);
            } catch (fallbackError) {
              console.warn('Fallback API also failed:', fallbackError);
              // Continue without results data
            }
          }

        } else {
          setError('No user data found. Please login again.');
        }
      } catch (err: any) {
        console.error('Failed to fetch student data:', err);
        setError(err.message || 'Failed to load student information. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  // Function to refresh results data
  const refreshResults = async () => {
    try {
      const userData = getUserData();
      if (userData?.id) {
        console.log('Refreshing results data...');
        const results = await getResultsData(userData.id, useCleanApi);
        setResultsData(results as AllResultsData);
      }
    } catch (error) {
      console.error('Failed to refresh results:', error);
    }
  };

  // Check if we're using cleaned results data
  const isCleanedResults = (data: AllResultsData): data is CleanedResultsData => {
    return 'overall' in data && 'semesters' in data;
  };

  // Check if we're using simple results data
  const isSimpleResults = (data: AllResultsData): data is SimpleResultsData => {
    return 'resultsBySession' in data && 'allResults' in data;
  };

  // Check if we're using original results data
  const isOriginalResults = (data: AllResultsData): data is ResultsData => {
    return 'gpaData' in data && 'resultsByLevel' in data;
  };

  // Get grade color based on grade letter
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-400';
      case 'B': return 'text-blue-400';
      case 'C': return 'text-yellow-400';
      case 'D': return 'text-orange-400';
      case 'E': return 'text-red-300';
      case 'F': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Get CGPA display text for results header
  const getCgpaDisplay = (data: AllResultsData) => {
    if (isCleanedResults(data)) {
      return `${data.overall.cgpa.toFixed(2)} CGPA`;
    } else if (isSimpleResults(data)) {
      return `${data.studentInfo.cgpa.toFixed(2)} CGPA`;
    } else {
      return `${data.cgpa} CGPA`;
    }
  };

  // Render results based on data type
  const renderResultsContent = () => {
    if (!resultsData) return null;

    if (isCleanedResults(resultsData)) {
      return (
        <>
          {/* Overall GPA Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {resultsData.semesters.map((semester, index) => (
              <div key={index} className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-xl p-4 border border-cyan-500/20 hover:scale-105 transition-transform duration-300">
                <h3 className="text-cyan-300 font-semibold mb-2 text-sm">
                  {(() => {
                    const semNum = semester.semester.substring(9, 10);
                    const suffix = semNum === '1' ? 'st' : semNum === '2' ? 'nd' : semNum === '3' ? 'rd' : 'th';
                    return `${semester.semester.substring(9,10)}${suffix} ${semester.semester.substring(0,9)} `;
                  })()}
                </h3>

                <p className="text-2xl font-bold text-white">{semester.gpa.toFixed(2)}</p>
                <p className="text-gray-300 text-xs">
                  {semester.session} • {semester.level}00
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {semester.courses.length} courses
                </p>
              </div>
            ))}
          </div>

          {/* Detailed Results by Semester */}
          {resultsData.semesters.map((semester, semesterIndex) => (
            <div key={semesterIndex} className="mb-8">
              <div className="flex justify-between items-center mb-4 bg-gray-900/50 rounded-lg px-4 py-3 border border-gray-600/30">
                <div>
                  <h3 className="text-cyan-300 font-semibold mb-2 text-xl">
                  {(() => {
                    const semNum = semester.semester.substring(9, 10);
                    const suffix = semNum === '1' ? 'st' : semNum === '2' ? 'nd' : semNum === '3' ? 'rd' : 'th';
                    return `${semester.semester.substring(9,10)}${suffix} ${semester.semester.substring(0,9)} `;
                  })()}
                </h3>
                  <p className="text-gray-300 text-sm">Level {semester.level}00</p>
                </div>
                <div className="text-right">
                  <span className="text-cyan-300 font-semibold text-lg">
                    {semester.gpa.toFixed(2)} GPA
                  </span>
                  <p className="text-gray-400 text-xs">
                    {semester.totalCredits} credits
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-900/50 rounded-lg border border-gray-600/30 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-600/30 bg-gray-800/50">
                        <th className="text-left p-4 text-cyan-300 text-sm font-semibold">Course Code</th>
                        <th className="text-left p-4 text-cyan-300 text-sm font-semibold">Course Title</th>
                        <th className="text-left p-4 text-cyan-300 text-sm font-semibold">Grade</th>
                        <th className="text-left p-4 text-cyan-300 text-sm font-semibold">Score</th>
                        <th className="text-left p-4 text-cyan-300 text-sm font-semibold">Units</th>
                        <th className="text-left p-4 text-cyan-300 text-sm font-semibold">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {semester.courses.map((course, courseIndex) => (
                        <tr 
                          key={courseIndex} 
                          className="border-b border-gray-600/30 hover:bg-gray-700/30 transition-colors duration-200 last:border-0"
                        >
                          <td className="p-4 text-white text-sm font-mono">{course.courseCode}</td>
                          <td className="p-4 text-white text-sm">{course.courseName}</td>
                          <td className={`p-4 text-sm font-bold ${getGradeColor(course.grade)}`}>
                            {course.grade}
                          </td>
                          <td className="p-4 text-white text-sm">{course.totalScore || 'N/A'}</td>
                          <td className="p-4 text-white text-sm">{course.creditUnit}</td>
                          <td className="p-4 text-white text-sm">{course.gradePoint}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </>
      );
    } else if (isSimpleResults(resultsData)) {
      return (
        <>
          {/* Overall GPA Summary */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-xl p-6 border border-cyan-500/20 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-cyan-300 text-sm">CGPA</p>
                <p className="text-2xl font-bold text-white">{resultsData.studentInfo.cgpa.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-purple-300 text-sm">Total Credits</p>
                <p className="text-2xl font-bold text-white">{resultsData.studentInfo.totalCredits}</p>
              </div>
              <div className="text-center">
                <p className="text-green-300 text-sm">Courses</p>
                <p className="text-2xl font-bold text-white">{resultsData.studentInfo.totalCourses}</p>
              </div>
              <div className="text-center">
                <p className="text-yellow-300 text-sm">Level</p>
                <p className="text-2xl font-bold text-white">{currentData.level}</p>
              </div>
            </div>
          </div>

          {/* Results by Session */}
          {Object.entries(resultsData.resultsBySession).map(([session, semesters]: [string, any]) => (
            <div key={session} className="mb-8">
              <h3 className="text-xl font-semibold text-cyan-300 mb-4 flex items-center">
                <span className="mr-2">📅</span>
                {session}
              </h3>
              
              {Object.entries(semesters).map(([semester, courses]: [string, any]) => (
                <div key={semester} className="mb-6">
                  <div className="flex justify-between items-center mb-4 bg-gray-900/50 rounded-lg px-4 py-3 border border-gray-600/30">
                    <h4 className="text-lg font-semibold text-purple-300">{semester}</h4>
                    <p className="text-gray-400 text-sm">{courses.length} courses</p>
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-lg border border-gray-600/30 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-600/30 bg-gray-800/50">
                            <th className="text-left p-4 text-cyan-300 text-sm font-semibold">Course Code</th>
                            <th className="text-left p-4 text-cyan-300 text-sm font-semibold">Course Title</th>
                            <th className="text-left p-4 text-cyan-300 text-sm font-semibold">Grade</th>
                            <th className="text-left p-4 text-cyan-300 text-sm font-semibold">Score</th>
                            <th className="text-left p-4 text-cyan-300 text-sm font-semibold">Units</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(courses as any[]).map((course, index) => (
                            <tr 
                              key={index} 
                              className="border-b border-gray-600/30 hover:bg-gray-700/30 transition-colors duration-200 last:border-0"
                            >
                              <td className="p-4 text-white text-sm font-mono">{course.courseCode}</td>
                              <td className="p-4 text-white text-sm">{course.courseName}</td>
                              <td className={`p-4 text-sm font-bold ${getGradeColor(course.grade)}`}>
                                {course.grade}
                              </td>
                              <td className="p-4 text-white text-sm">{course.score || 'N/A'}</td>
                              <td className="p-4 text-white text-sm">{course.creditUnit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </>
      );
    } else {
      // Original Results Display
      return (
        <>
          {/* Overall GPA Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
  {Object.entries(resultsData.gpaData as Record<string, unknown>).map(
    ([level, sessionData]: [string, unknown]) => {
      // Ensure sessionData is an object
      if (typeof sessionData !== "object" || sessionData === null) return null;

      // Flatten semester GPAs and ensure each value is a string or number
      const levelGpas: number[] = Object.values(sessionData)
        .flatMap((semesters) =>
          typeof semesters === "object" && semesters !== null
            ? Object.values(semesters)
            : []
        )
        .filter((gpa): gpa is string | number => {
          const val = typeof gpa === "number" ? gpa.toString() : gpa;
          return typeof val === "string" && val.trim() !== "" && val !== "0.00";
        })
        .map((gpa) => parseFloat(String(gpa)))
        .filter((n) => !isNaN(n));

      // Compute level average GPA safely
      const levelAvg: string =
        levelGpas.length > 0
          ? (levelGpas.reduce((sum, value) => sum + value, 0) / levelGpas.length).toFixed(2)
          : "0.00";

      return (
        <div
          key={level}
          className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-xl p-4 border border-cyan-500/20 hover:scale-105 transition-transform duration-300"
        >
          <h3 className="text-cyan-300 font-semibold mb-2 text-sm">{level}</h3>
          <p className="text-2xl font-bold text-white">{levelAvg}</p>
          <p className="text-gray-300 text-xs">Average GPA</p>
        </div>
      );
    }
  )}
</div>


          {/* Detailed Results by Level */}
          {Object.entries(resultsData.resultsByLevel).map(([level, sessions]: [string, any]) => (
            <div key={level} className="mb-8">
              <h3 className="text-xl font-semibold text-cyan-300 mb-4 flex items-center">
                <span className="mr-2">📈</span>
                {level} Results
              </h3>
              
              {Object.entries(sessions).map(([session, semesters]: [string, any]) => (
                <div key={session} className="mb-6">
                  <h4 className="text-lg font-semibold text-purple-300 mb-3 bg-purple-500/10 rounded-lg px-4 py-2 border border-purple-500/20">
                    {session}
                  </h4>
                  
                  {Object.entries(semesters).map(([semester, courses]: [string, any]) => (
                    <div key={semester} className="mb-6">
                      <div className="flex justify-between items-center mb-4 bg-gray-900/50 rounded-lg px-4 py-3 border border-gray-600/30">
                        <h5 className="text-md font-semibold text-gray-300 flex items-center">
                          <span className="mr-2">📅</span>
                          {semester}
                        </h5>
                        <div className="text-right">
                          <span className="text-cyan-300 font-semibold text-lg">
                            {resultsData.gpaData[level]?.[session]?.[semester] || "0.00"}
                          </span>
                          <p className="text-gray-400 text-xs">GPA</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-900/50 rounded-lg border border-gray-600/30 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-600/30 bg-gray-800/50">
                                <th className="text-left p-4 text-cyan-300 text-sm font-semibold">Course Code</th>
                                <th className="text-left p-4 text-cyan-300 text-sm font-semibold">Course Title</th>
                                <th className="text-left p-4 text-cyan-300 text-sm font-semibold">Grade</th>
                                <th className="text-left p-4 text-cyan-300 text-sm font-semibold">Score</th>
                                <th className="text-left p-4 text-cyan-300 text-sm font-semibold">Units</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(courses as any[]).map((course, index) => (
                                <tr 
                                  key={index} 
                                  className="border-b border-gray-600/30 hover:bg-gray-700/30 transition-colors duration-200 last:border-0"
                                >
                                  <td className="p-4 text-white text-sm font-mono">{course.courseCode}</td>
                                  <td className="p-4 text-white text-sm">{course.courseName}</td>
                                  <td className={`p-4 text-sm font-bold ${getGradeColor(course.Grade)}`}>
                                    {course.Grade}
                                  </td>
                                  <td className="p-4 text-white text-sm">{course.TotalScores || 'N/A'}</td>
                                  <td className="p-4 text-white text-sm">{course.creditUnits}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </>
      );
    }
  };

  // Animated background effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
    }> = [];

    const colors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
      '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
    ];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(10, 10, 20, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x > canvas.width) particle.x = 0;
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.y > canvas.height) particle.y = 0;
        if (particle.y < 0) particle.y = canvas.height;

        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 2
        );
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        ctx.fill();

        particles.slice(index + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cyan-300">Loading student portal...</p>
          <p className="text-gray-400 text-sm mt-2">Fetching your academic data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative flex items-center justify-center bg-gray-900">
        <div className="text-center max-w-md mx-4">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <p className="text-red-300 text-lg mb-2">Failed to load dashboard</p>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-white font-semibold transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gray-900 overflow-hidden">
      {/* Animated Background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/10 to-cyan-900/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-gray-900 to-gray-900" />

      {/* Header */}
      <div className="relative z-10">
        <div className="bg-gray-800/70 backdrop-blur-xl border-b border-gray-700/50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  IAUOE Student Portal
                </h1>
                <p className="text-gray-300 text-sm">Welcome back, {currentData.name}</p>
              </div>
              <div className="text-right">
                <p className="text-cyan-300 font-semibold">{currentData.matricNo}</p>
                <p className="text-gray-400 text-sm">{currentData.session} • {currentData.level}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700/30">
          <div className="container mx-auto px-6">
            <nav className="flex space-x-8 overflow-x-auto">
              {[
                { id: 'primary', name: 'Primary Info' },
                { id: 'courses', name: 'Courses' },
                { id: 'result', name: 'Results' },
                { id: 'library', name: 'Library' },
                { id: 'questions', name: 'Questions' },
                { id: 'games', name: 'Games' },
                { id: 'password', name: 'Password' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
              <div className="space-y-4">
                <div className="text-center mb-6">
                  {currentData.imageUrl ? (
                    <img 
                      src={currentData.imageUrl} 
                      alt="Student" 
                      className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-2 border-cyan-400"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {currentData.name.split(',')[0].charAt(0)}
                      </span>
                    </div>
                  )}
                  <h3 className="text-white font-semibold">{currentData.name}</h3>
                  <p className="text-cyan-300 text-sm">{currentData.matricNo}</p>
                  <p className="text-gray-400 text-xs mt-1">{currentData.level}</p>
                </div>

                {/* Quick Stats */}
                <div className="space-y-3">
                  <div className={`bg-gradient-to-br ${currentData.grade.includes('First') ? 'from-green-400 to-emerald-500' : 
                    currentData.grade.includes('Second Class Upper') ? 'from-blue-400 to-cyan-500' :
                    currentData.grade.includes('Second Class Lower') ? 'from-purple-400 to-indigo-500' :
                    currentData.grade.includes('Third') ? 'from-orange-400 to-amber-500' : 'from-red-400 to-pink-500'} rounded-xl p-4 border border-gray-600/30`}>
                    <p className="text-white text-sm opacity-90">CGPA</p>
                    <p className="text-2xl font-bold text-white">
                      {currentData.cgpa}
                    </p>
                    <p className="text-white text-sm opacity-90">{currentData.grade}</p>
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-600/30">
                    <p className="text-gray-400 text-sm">Current Session</p>
                    <p className="text-white font-semibold">{currentData.session}</p>
                    <p className="text-gray-300 text-sm">{currentData.level}</p>
                  </div>

                  {/* Academic Progress */}
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
                    <p className="text-purple-300 text-sm mb-2">Academic Progress</p>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${(parseFloat(currentData.cgpa) / 5.0) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-gray-300 text-xs mt-2 text-center">
                      {currentData.cgpa} / 5.0
                    </p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl p-4 border border-cyan-500/20">
                  <h4 className="text-cyan-300 font-semibold mb-3 flex items-center">
                    <span className="mr-2">📧</span>
                    Contact Info
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start">
                      <span className="text-cyan-400 mr-2">🏛️</span>
                      <div>
                        <p className="text-white font-medium">{currentData.faculty}</p>
                        <p className="text-gray-300">{currentData.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-cyan-400 mr-2">📱</span>
                      <p className="text-gray-300">{currentData.phone}</p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-cyan-400 mr-2">✉️</span>
                      <p className="text-gray-300 break-all">{currentData.email}</p>
                    </div>
                    <div className="flex items-center pt-2 border-t border-cyan-500/20">
                      <span className="text-purple-400 mr-2">📅</span>
                      <p className="text-purple-300 text-xs">Active: {currentData.session}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Primary Information */}
            {activeTab === 'primary' && (
              <div className="bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    Primary Information
                  </h2>
                  <div className="text-right">
                    <p className="text-cyan-300 text-sm">Last Updated</p>
                    <p className="text-gray-400 text-xs">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-600/30">
                    <h3 className="text-lg font-semibold text-cyan-300 mb-4 flex items-center">
                      <span className="mr-2">👤</span>
                      Personal Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-gray-600/30 pb-3">
                        <span className="text-gray-400 flex items-center">
                          <span className="mr-2">🎫</span>
                          Matric No.
                        </span>
                        <span className="text-white font-mono">{currentData.matricNo}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-600/30 pb-3">
                        <span className="text-gray-400 flex items-center">
                          <span className="mr-2">⚧️</span>
                          Gender
                        </span>
                        <span className="text-white">{currentData.gender}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-600/30 pb-3">
                        <span className="text-gray-400 flex items-center">
                          <span className="mr-2">🎂</span>
                          Date of Birth
                        </span>
                        <span className="text-white">{currentData.dob}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-gray-400 flex items-start">
                          <span className="mr-2">🏠</span>
                          Home Address
                        </span>
                        <span className="text-white text-right max-w-[200px]">{currentData.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Academic Overview */}
                  <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-600/30">
                    <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center">
                      <span className="mr-2">🎓</span>
                      Academic Overview
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-400 text-sm mb-2">Faculty & Department</p>
                        <div className="bg-gradient-to-r from-cyan-500/10 to-cyan-500/5 rounded-lg p-3 border border-cyan-500/20 mb-2">
                          <p className="text-cyan-300 text-sm">Faculty</p>
                          <p className="text-white font-semibold">{currentData.faculty}</p>
                        </div>
                        <div className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 rounded-lg p-3 border border-purple-500/20">
                          <p className="text-purple-300 text-sm">Department</p>
                          <p className="text-white font-semibold">{currentData.department}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 rounded-lg p-3 border border-cyan-500/20">
                          <p className="text-cyan-300 text-sm">Current Level</p>
                          <p className="text-white font-semibold">{currentData.level}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-lg p-3 border border-purple-500/20">
                          <p className="text-purple-300 text-sm">Active Session</p>
                          <p className="text-white font-semibold">{currentData.session}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl p-6 border border-cyan-500/20">
                  <h3 className="text-lg font-semibold text-cyan-300 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button 
                      onClick={() => setActiveTab('courses')}
                      className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg p-3 border border-cyan-500/30 transition-all duration-300 hover:scale-105"
                    >
                      <div className="text-center">
                        <div className="text-lg mb-1">📚</div>
                        <p className="text-sm">View Courses</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => setActiveTab('result')}
                      className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg p-3 border border-purple-500/30 transition-all duration-300 hover:scale-105"
                    >
                      <div className="text-center">
                        <div className="text-lg mb-1">📊</div>
                        <p className="text-sm">Check Results</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => setActiveTab('library')}
                      className="bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 rounded-lg p-3 border border-pink-500/30 transition-all duration-300 hover:scale-105"
                    >
                      <div className="text-center">
                        <div className="text-lg mb-1">🏛️</div>
                        <p className="text-sm">Library</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => setActiveTab('password')}
                      className="bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg p-3 border border-green-500/30 transition-all duration-300 hover:scale-105"
                    >
                      <div className="text-center">
                        <div className="text-lg mb-1">🔐</div>
                        <p className="text-sm">Password</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results Tab */}
            {activeTab === 'result' && (
              <div className="bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    Academic Results
                  </h2>
                  <div className="flex items-center space-x-4">
                    {resultsData && (
                      <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${resultsData.gradeClass.color} border border-gray-600/30`}>
                        <p className="text-white font-semibold text-sm">
                          {getCgpaDisplay(resultsData)}
                        </p>
                        <p className="text-white text-xs opacity-90">{resultsData.gradeClass.class}</p>
                      </div>
                    )}
                    <button
                      onClick={refreshResults}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm font-semibold transition-colors flex items-center"
                    >
                      <span className="mr-2">🔄</span>
                      Refresh
                    </button>
                  </div>
                </div>

                {!resultsData ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white text-2xl">📊</span>
                    </div>
                    <p className="text-gray-300 text-lg mb-2">Results Not Available</p>
                    <p className="text-gray-400 mb-4">Unable to fetch results data at the moment.</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-white font-semibold transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <>
                    {renderResultsContent()}

                    {/* Failed Courses - Common for all data types */}
                    {resultsData.failedCourses.length > 0 && (
                      <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-xl p-6 border border-red-500/20 mt-8">
                        <h3 className="text-lg font-semibold text-red-300 mb-4 flex items-center">
                          <span className="mr-2">⚠️</span>
                          Failed Courses ({resultsData.failedCourses.length})
                        </h3>
                        <div className="space-y-3">
                            {Array.isArray(resultsData?.failedCourses) && resultsData.failedCourses.length > 0 ? (
                              resultsData.failedCourses.map(
                                (
                                  course: {
                                    code: string;
                                    title: string;
                                    session: string;
                                    grade: string;
                                  },
                                  index: number
                                ) => (
                                  <div
                                    key={index}
                                    className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-900/50 rounded-lg border border-red-500/30 hover:bg-red-500/10 transition-colors"
                                  >
                                    <span className="text-red-300 font-semibold text-sm">{course.code}</span>
                                    <span className="text-white col-span-2 text-sm">{course.title}</span>
                                    <span className="text-gray-400 text-sm">{course.session}</span>
                                    <span className="text-red-400 font-bold text-sm">{course.grade}</span>
                                  </div>
                                )
                              )
                            ) : (
                              <p className="text-gray-400 text-sm italic">No failed courses 🎉</p>
                            )}
                        </div>

                        </div>
                    )}
                  </>
                )}
              </div>
            )}
            {activeTab === 'games' && <GameCenter />}

            {/* Other tabs */}
            {!['primary', 'result','games'].includes(activeTab) && (
              <div className="bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-6">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Section
                </h2>
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white text-2xl">⚡</span>
                  </div>
                  <p className="text-gray-300 text-lg mb-2">
                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Portal
                  </p>
                  <p className="text-gray-400">This section is currently under development</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}