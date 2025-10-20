// pages/api/student-results-simple.ts
import { NextApiRequest, NextApiResponse } from 'next';

const GRADE_POINTS: { [key: string]: number } = {
  'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0
};

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

    console.log('Fetching simple results for student ID:', studentId);

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
    const cleanData = cleanStudentResults(rawData);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    res.status(200).json(cleanData);
  } catch (error: any) {
    console.error('Student results API error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}

function cleanStudentResults(rawData: any) {
  const { studentResult, courseReg } = rawData;
  
  // Create course lookup
  const courseMap = new Map();
  courseReg.forEach((course: any) => {
    courseMap.set(course.CourseID, {
      code: course.CourseCode,
      name: course.CourseRegistrationName,
      credits: course.CreditUnit
    });
  });

  // Clean results
  const cleanedResults = studentResult.map((result: any) => {
    const course = courseMap.get(result.CourseID);
    return {
      courseCode: course?.code || 'N/A',
      courseName: course?.name || 'Unknown Course',
      grade: result.Grade,
      gradePoint: GRADE_POINTS[result.Grade] || 0,
      creditUnit: course?.credits || 0,
      score: result.TotalScores,
      semester: `Semester ${result.SemesterID}`,
      session: result.SessionName,
      status: result.FinalApprovalStatus
    };
  });

  // Calculate CGPA
  const totalCredits = cleanedResults.reduce((sum: number, result: any) => sum + result.creditUnit, 0);
  const totalGradePoints = cleanedResults.reduce((sum: number, result: any) => 
    sum + (result.gradePoint * result.creditUnit), 0
  );
  const cgpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

  return {
    studentInfo: {
      matricNumber: studentResult[0]?.MatNo,
      totalCourses: cleanedResults.length,
      totalCredits,
      cgpa: parseFloat(cgpa.toFixed(2))
    },
    results: cleanedResults
  };
}