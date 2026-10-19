import { db, auth } from "./firebase-config.js";
import { 
  collection, doc, setDoc, getDoc, getDocs, 
  query, where, serverTimestamp, writeBatch, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export const ExamEngine = {
  
  // 1. SAVE EXAM METADATA
  async createExam(classId, examData) {
    const examRef = doc(collection(db, "exams"));
    await setDoc(examRef, {
      ...examData,
      classId,
      createdBy: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      status: 'draft', // draft, published, closed
      settings: {
        showResultsImmediately: false,
        randomizeQuestions: true,
        allowBacktracking: false,
        requireSEB: true // Secure Exam Browser flag
      }
    });
    return examRef.id;
  },

  // 2. ADD QUESTIONS (Supports Manual & AI)
  async saveQuestions(examId, questionsArray) {
    const batch = writeBatch(db);
    const questionsRef = collection(db, "exams", examId, "questions");
    
    questionsArray.forEach((q, index) => {
      const qRef = doc(questionsRef);
      batch.set(qRef, {
        ...q,
        order: index,
        points: q.points || 1
      });
    });
    
    await batch.commit();
  },

  // 3. DEEPSEEK AI GENERATOR (Replaces your PHP TOS/AI logic)
  async generateAIQuestions(topic, questionTypes, count, gradeLevel) {
    // Note: In production, never expose your API key on the client side. 
    // Use a Firebase Cloud Function to proxy this request.
    const prompt = `Generate ${count} ${questionTypes} questions about ${topic} for ${gradeLevel}. 
    Return ONLY a JSON array with format: [{"type": "multiple_choice", "question": "...", "options": ["A...", "B...", "C...", "D..."], "answer": "A"}]`;

    try {
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer YOUR_DEEPSEEK_API_KEY" // Move to backend later
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7
        })
      });
      const data = await response.json();
      const content = data.choices[0].message.content;
      // Extract JSON from markdown block if necessary
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("AI Generation Failed:", error);
      throw error;
    }
  },

  // 4. DELETE EXAM
  async deleteExam(examId) {
    // Note: You must also recursively delete the questions subcollection 
    // (Best done via a Cloud Function, but we'll do a simple delete here)
    await deleteDoc(doc(db, "exams", examId));
  }
};