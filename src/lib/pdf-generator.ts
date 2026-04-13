'use client';

import jsPDF from 'jspdf';
import { AnalysisResult } from './ai-grader';

export const generatePDF = (data: AnalysisResult, storeUrl: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(99, 102, 241); // Indigo color
  doc.text('StorePulse Audit Report', 20, yPos);
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`URL: ${storeUrl}`, 20, yPos);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 60, yPos);

  yPos += 20;
  // Overall Score
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('Overall Health Score:', 20, yPos);
  doc.setFontSize(32);
  doc.setTextColor(data.score >= 70 ? 16 : 0, data.score >= 70 ? 185 : 0, data.score >= 70 ? 129 : 0);
  doc.text(`${data.score}/100`, 85, yPos + 2);

  yPos += 20;
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(data.summary, 20, yPos, { maxWidth: 170 });

  yPos += 25;
  // Categories
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Category Breakdown:', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  Object.entries(data.categories).forEach(([key, score]) => {
    doc.text(`${key.toUpperCase()}:`, 20, yPos);
    doc.text(`${score}%`, 60, yPos);
    yPos += 7;
  });

  yPos += 12;
  // Seller Insights Section
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Seller Strategic Insights:', 20, yPos);
  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Trust Score: ${data.sellerInsights.trustScore}/100`, 25, yPos);
  doc.text(`Growth Potential: ${data.sellerInsights.growthPotential}`, 80, yPos);
  yPos += 7;
  doc.text(`Market Positioning: ${data.sellerInsights.marketPositioning}`, 25, yPos, { maxWidth: 160 });
  
  yPos += 15;
  // Visual Analysis
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Visual & Marketing Audit:', 20, yPos);
  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Banner Clarity: ${data.visualAnalysis.bannerClarity}`, 25, yPos, { maxWidth: 160 });
  yPos += 12;
  if (data.visualAnalysis.couponDetected) {
    doc.setTextColor(99, 102, 241);
    doc.text(`[COUPON DETECTED] Feedback: ${data.visualAnalysis.couponFeedback}`, 25, yPos, { maxWidth: 160 });
    yPos += 12;
  }

  // Recommendations
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Actionable To-Do List:', 20, yPos);
  yPos += 10;

  data.recommendations.forEach((rec, index) => {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(99, 102, 241);
    doc.text(`${index + 1}. ${rec.title}`, 20, yPos);
    yPos += 7;
    
    doc.setFontSize(9);
    doc.setTextColor(80);
    const descLines = doc.splitTextToSize(rec.description, 160);
    doc.text(descLines, 25, yPos);
    yPos += (descLines.length * 5) + 3;

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text('WHAT TO DO:', 25, yPos);
    doc.setTextColor(16, 185, 129);
    const suggestionLines = doc.splitTextToSize(rec.suggestedValue, 130);
    doc.text(suggestionLines, 55, yPos);
    yPos += (suggestionLines.length * 5) + 8;
  });

  doc.save(`StoreAudit-Report-${new Date().getTime()}.pdf`);
};
