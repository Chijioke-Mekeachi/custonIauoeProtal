// lib/api.ts
const API_BASE_URL = '/api';

// Get stored token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
};

// Generic API request function
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (token) {
    // Make sure we're sending the full Bearer token
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  try {
    console.log(`Making API request to: ${endpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorText = 'No error details';
      try {
        errorText = await response.text();
      } catch (e) {
        console.warn('Could not read error response body');
      }
      
      console.error(`API error ${response.status} for ${endpoint}:`, errorText);
      
      // Handle specific error codes
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      } else if (response.status === 404) {
        throw new Error('Requested resource not found.');
      } else {
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error(`API request failed for ${endpoint}:`, error);
    
    // Re-throw with more user-friendly message if it's a network error
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    
    throw error;
  }
}

// GPA Calculation functions
const calculateGPA = (results: any[], courseReg: any[], resultGrades: any[]) => {
  let totalPoints = 0;
  let totalUnits = 0;

  results.forEach(result => {
    const course = courseReg.find(c => c.CourseID === result.CourseID);
    const grade = resultGrades.find(g => g.ResultGradeName === result.Grade);
    
    if (course && grade) {
      const creditUnits = course.CreditUnit || 0;
      totalPoints += creditUnits * grade.Points;
      totalUnits += creditUnits;
    }
  });

  return totalUnits > 0 ? (totalPoints / totalUnits).toFixed(2) : "0.00";
};

const getGradeClass = (gpa: string) => {
  const numGpa = parseFloat(gpa);
  if (numGpa >= 4.5) return { class: "First Class", color: "from-green-400 to-emerald-500" };
  if (numGpa >= 3.5) return { class: "Second Class Upper", color: "from-blue-400 to-cyan-500" };
  if (numGpa >= 2.5) return { class: "Second Class Lower", color: "from-purple-400 to-indigo-500" };
  if (numGpa >= 1.5) return { class: "Third Class", color: "from-orange-400 to-amber-500" };
  return { class: "Pass", color: "from-red-400 to-pink-500" };
};

// API functions
export const api = {
  // Login through our proxy
  login: (username: string, password: string) => 
    apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  // Get student basic information with image
  getStudentInfo: (uin: string) => 
    apiRequest('/student-info', {
      method: 'POST',
      body: JSON.stringify({ id: uin }),
    }),

  // Get student results and academic data (original raw data)
  getStudentResults: (studentId: number) => 
    apiRequest('/student-results', {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    }),

  // Get cleaned student results with CGPA calculation
  getStudentResultsClean: (studentId: number) => 
    apiRequest('/student-results-clean', {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    }),

  // Get simple cleaned student results
  getStudentResultsSimple: (studentId: number) => 
    apiRequest('/student-results-simple', {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    }),

  // Get faculty information
  getFaculty: (facultyId: number) => 
    apiRequest(`/faculty?id=${facultyId}`, {
      method: 'GET',
    }),

  // Get department information
  getDepartment: (departmentId: number) => 
    apiRequest(`/department?id=${departmentId}`, {
      method: 'GET',
    }),
};

// Convert buffer data to image URL
export const bufferToImageUrl = (bufferData: number[]): string => {
  if (!bufferData || bufferData.length === 0) return '';
  const uint8Array = new Uint8Array(bufferData);
  const blob = new Blob([uint8Array], { type: 'image/jpeg' });
  return URL.createObjectURL(blob);
};

// Get user data from localStorage
export const getUserData = () => {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }
  return null;
};

// Process results data (for raw data)
export const processResultsData = (resultsData: any) => {
  if (!resultsData || !resultsData.studentResult) {
    throw new Error('Invalid results data structure');
  }

  const { studentResult, courseReg, resultGrades, levels, sessions } = resultsData;

  // Group results by level and semester
  const resultsByLevel: any = {};
  
  studentResult.forEach((result: any) => {
    const levelName = levels?.data?.find((l: any) => l.id === result.LevelID)?.LevelName || `Level ${result.LevelID}`;
    const semesterName = `Semester ${result.SemesterID}`;
    const sessionName = result.SessionName;
    
    if (!resultsByLevel[levelName]) {
      resultsByLevel[levelName] = {};
    }
    
    if (!resultsByLevel[levelName][sessionName]) {
      resultsByLevel[levelName][sessionName] = {};
    }
    
    if (!resultsByLevel[levelName][sessionName][semesterName]) {
      resultsByLevel[levelName][sessionName][semesterName] = [];
    }
    
    // Find course details
    const course = courseReg?.find((c: any) => c.CourseID === result.CourseID);
    const grade = resultGrades?.data?.find((g: any) => g.ResultGradeName === result.Grade);
    
    resultsByLevel[levelName][sessionName][semesterName].push({
      ...result,
      courseCode: course?.CourseCode,
      courseName: course?.CourseRegistrationName,
      creditUnits: course?.CreditUnit,
      gradePoints: grade?.Points,
    });
  });

  // Calculate GPA for each level and semester
  const gpaData: any = {};
  
  Object.keys(resultsByLevel).forEach(level => {
    gpaData[level] = {};
    Object.keys(resultsByLevel[level]).forEach(session => {
      gpaData[level][session] = {};
      Object.keys(resultsByLevel[level][session]).forEach(semester => {
        const semesterResults = resultsByLevel[level][session][semester];
        gpaData[level][session][semester] = calculateGPA(semesterResults, courseReg || [], resultGrades?.data || []);
      });
    });
  });

  // Calculate overall CGPA
  const allResults = studentResult.filter((r: any) => r.TotalScores !== null && r.TotalScores !== undefined);
  const cgpa = calculateGPA(allResults, courseReg || [], resultGrades?.data || []);
  const gradeClass = getGradeClass(cgpa);

  // Get failed courses
  const failedCourses = studentResult.filter((result: any) => 
    result.Grade === 'F' || result.TotalScores === null || result.TotalScores === 0
  ).map((result: any) => {
    const course = courseReg?.find((c: any) => c.CourseID === result.CourseID);
    return {
      code: course?.CourseCode,
      title: course?.CourseRegistrationName,
      session: result.SessionName,
      score: result.TotalScores,
      grade: result.Grade,
    };
  });

  return {
    resultsByLevel,
    gpaData,
    cgpa,
    gradeClass,
    failedCourses,
    rawData: resultsData,
  };
};

// Process cleaned results data (for the new clean API)
export const processCleanedResults = (cleanedData: any) => {
  if (!cleanedData) {
    throw new Error('No cleaned data received');
  }

  const { studentId, matricNumber, overall, semesters, allResults } = cleanedData;

  // Extract failed courses
  const failedCourses = allResults
    .filter((result: any) => result.grade === 'F' || result.gradePoint === 0)
    .map((result: any) => ({
      code: result.courseCode,
      title: result.courseName,
      session: result.session,
      score: result.totalScore,
      grade: result.grade,
      semester: result.semester,
    }));

  // Group by level and semester for display
  const resultsByLevel: any = {};
  
  semesters.forEach((semester: any) => {
    const level = semester.level;
    const session = semester.session;
    const semesterName = semester.semester;
    
    if (!resultsByLevel[level]) {
      resultsByLevel[level] = {};
    }
    
    if (!resultsByLevel[level][session]) {
      resultsByLevel[level][session] = {};
    }
    
    resultsByLevel[level][session][semesterName] = semester.courses.map((course: any) => ({
      ...course,
      courseCode: course.courseCode,
      courseName: course.courseName,
      creditUnits: course.creditUnit,
      gradePoints: course.gradePoint,
      TotalScores: course.totalScore,
      Grade: course.grade,
      SessionName: course.session,
    }));
  });

  // Get grade class for CGPA
  const gradeClass = getGradeClass(overall.cgpa.toString());

  return {
    studentInfo: {
      studentId,
      matricNumber,
    },
    overall: {
      cgpa: overall.cgpa,
      totalCredits: overall.totalCredits,
      totalGradePoints: overall.totalGradePoints,
    },
    semesters: semesters.map((semester: any) => ({
      semester: semester.semester,
      session: semester.session,
      level: semester.level,
      gpa: semester.gpa,
      totalCredits: semester.totalCredits,
      courses: semester.courses,
    })),
    resultsByLevel,
    gradeClass,
    failedCourses,
    rawData: cleanedData,
  };
};

// Process simple cleaned results
export const processSimpleResults = (simpleData: any) => {
  if (!simpleData) {
    throw new Error('No simple data received');
  }

  const { studentInfo, results } = simpleData;

  // Group by session and semester
  const resultsBySession: any = {};
  
  results.forEach((result: any) => {
    const session = result.session;
    const semester = result.semester;
    
    if (!resultsBySession[session]) {
      resultsBySession[session] = {};
    }
    
    if (!resultsBySession[session][semester]) {
      resultsBySession[session][semester] = [];
    }
    
    resultsBySession[session][semester].push(result);
  });

  // Get failed courses
  const failedCourses = results
    .filter((result: any) => result.grade === 'F' || result.gradePoint === 0)
    .map((result: any) => ({
      code: result.courseCode,
      title: result.courseName,
      session: result.session,
      score: result.score,
      grade: result.grade,
      semester: result.semester,
    }));

  const gradeClass = getGradeClass(studentInfo.cgpa.toString());

  return {
    studentInfo,
    resultsBySession,
    gradeClass,
    failedCourses,
    allResults: results,
  };
};

// Helper function to determine which API to use
export const getResultsData = async (studentId: number, useCleanApi: boolean = true) => {
  try {
    if (useCleanApi) {
      const cleanData = await api.getStudentResultsClean(studentId);
      return processCleanedResults(cleanData);
    } else {
      const rawData = await api.getStudentResults(studentId);
      return processResultsData(rawData);
    }
  } catch (error) {
    console.error('Error fetching results data:', error);
    
    // Fallback to simple API if clean API fails
    if (useCleanApi) {
      try {
        console.log('Falling back to simple results API...');
        const simpleData = await api.getStudentResultsSimple(studentId);
        return processSimpleResults(simpleData);
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError);
      }
    }
    
    throw error;
  }
};

export { calculateGPA, getGradeClass };