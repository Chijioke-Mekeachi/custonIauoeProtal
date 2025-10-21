// pages/api/student-results-clean.ts
import { NextApiRequest, NextApiResponse } from 'next';

// Grade points mapping
const GRADE_POINTS: { [key: string]: number } = {
  'A': 5,
  'B': 4,
  'C': 3,
  'D': 2,
  'E': 1,
  'F': 0
};

interface CleanResult {
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
}

interface SemesterSummary {
  semester: string;
  session: string;
  level: string;
  totalCredits: number;
  totalGradePoints: number;
  gpa: number;
  courses: CleanResult[];
}

interface StudentResults {
  studentId: number;
  matricNumber: string;
  overall: {
    totalCredits: number;
    totalGradePoints: number;
    cgpa: number;
  };
  semesters: SemesterSummary[];
  allResults: CleanResult[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header required' });
    }

    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    console.log('Fetching results for student ID:', studentId);

    const response = await fetch(`https://srpapi.iaueesp.com/v1/studentResult/student?StudentID=${studentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://srp.iaueesp.com',
        'Referer': 'https://srp.iaueesp.com/',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        'Authorization': authHeader,
      },
      body: JSON.stringify([]),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API error details:', errorText);
      throw new Error(`External API error: ${response.status} - ${errorText}`);
    }

    const rawData = await response.json();
    
    // Process and clean the data
    const cleanResults = processStudentResults(rawData);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    res.status(200).json(cleanResults);
  } catch (error: any) {
    console.error('Student results API error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}

function processStudentResults(rawData: any): StudentResults {
  const { studentResult, courseReg, sessions, levels } = rawData;
  
  // Create course lookup map
  const courseMap = new Map();
  courseReg.forEach((course: any) => {
    courseMap.set(course.CourseID, {
      code: course.CourseCode,
      name: course.CourseRegistrationName,
      credits: course.CreditUnit
    });
  });

  // Create level lookup map
  const levelMap = new Map();
  levels.data.forEach((level: any) => {
    levelMap.set(level.id, level.LevelName);
  });

  // Create session lookup for proper sorting
  const sessionMap = new Map();
  sessions.data.forEach((session: any) => {
    sessionMap.set(session.id, session.SessionName);
  });

  // Process each result and handle duplicates by keeping the last occurrence
  const courseLastOccurrence = new Map();
  
  // First pass: identify the last occurrence of each course
  studentResult.forEach((result: any, index: number) => {
    const courseInfo = courseMap.get(result.CourseID);
    
    if (!courseInfo) {
      console.warn(`Course info not found for CourseID: ${result.CourseID}`);
      return;
    }

    // Use course code as key to track duplicates
    const courseKey = courseInfo.code;
    courseLastOccurrence.set(courseKey, index);
  });

  // Second pass: collect only the last occurrence of each course
  const uniqueResults: CleanResult[] = [];
  const processedCourses = new Set();
  
  // Process in reverse order to easily get the last occurrence
  for (let i = studentResult.length - 1; i >= 0; i--) {
    const result = studentResult[i];
    const courseInfo = courseMap.get(result.CourseID);
    
    if (!courseInfo) continue;

    const courseKey = courseInfo.code;
    
    // If we haven't processed this course yet, and this is its last occurrence
    if (!processedCourses.has(courseKey) && courseLastOccurrence.get(courseKey) === i) {
      const levelName = levelMap.get(result.LevelID) || `Level ${result.LevelID}`;
      const semesterName = `Semester ${result.SemesterID}`;
      
      const cleanResult: CleanResult = {
        courseCode: courseInfo.code,
        courseName: courseInfo.name,
        grade: result.Grade,
        gradePoint: GRADE_POINTS[result.Grade] || 0,
        creditUnit: courseInfo.credits,
        totalScore: result.TotalScores || 0,
        semester: semesterName,
        session: result.SessionName,
        level: levelName,
        status: result.FinalApprovalStatus
      };

      uniqueResults.push(cleanResult);
      processedCourses.add(courseKey);
    }
  }

  // Reverse back to maintain chronological order (oldest to newest)
  uniqueResults.reverse();

  // Group by semester
  const semesterMap = new Map();
  
  uniqueResults.forEach((cleanResult: CleanResult) => {
    const semesterKey = `${cleanResult.session}-${cleanResult.semester}`;
    
    if (!semesterMap.has(semesterKey)) {
      semesterMap.set(semesterKey, {
        semester: cleanResult.semester,
        session: cleanResult.session,
        level: cleanResult.level,
        courses: []
      });
    }
    semesterMap.get(semesterKey).courses.push(cleanResult);
  });

  // Calculate semester GPAs and overall CGPA
  const semesters: SemesterSummary[] = [];
  let totalCredits = 0;
  let totalGradePoints = 0;

  semesterMap.forEach((semesterData, key) => {
    let semesterCredits = 0;
    let semesterGradePoints = 0;

    semesterData.courses.forEach((course: CleanResult) => {
      semesterCredits += course.creditUnit;
      semesterGradePoints += course.gradePoint * course.creditUnit;
    });

    const gpa = semesterCredits > 0 ? semesterGradePoints / semesterCredits : 0;

    semesters.push({
      semester: semesterData.semester,
      session: semesterData.session,
      level: semesterData.level,
      totalCredits: semesterCredits,
      totalGradePoints: semesterGradePoints,
      gpa: parseFloat(gpa.toFixed(2)),
      courses: semesterData.courses
    });

    totalCredits += semesterCredits;
    totalGradePoints += semesterGradePoints;
  });

  // Sort semesters by session and semester (newest first)
  semesters.sort((a, b) => {
    const sessionCompare = b.session.localeCompare(a.session);
    if (sessionCompare !== 0) return sessionCompare;
    return b.semester.localeCompare(a.semester);
  });

  const cgpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

  return {
    studentId: studentResult[0]?.StudentID || 0,
    matricNumber: studentResult[0]?.MatNo || '',
    overall: {
      totalCredits,
      totalGradePoints,
      cgpa: parseFloat(cgpa.toFixed(2))
    },
    semesters,
    allResults: uniqueResults
  };
}