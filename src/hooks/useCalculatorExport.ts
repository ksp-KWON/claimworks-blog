import { RefObject } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export function useCalculatorExport(resultRef: RefObject<HTMLDivElement | null>) {
  const exportPDF = async (filename: string) => {
    if (!resultRef.current) return;
    try {
      const originalBg = resultRef.current.style.backgroundColor;
      resultRef.current.style.backgroundColor = '#ffffff';
      const imgData = await toPng(resultRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      resultRef.current.style.backgroundColor = originalBg;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (resultRef.current.offsetHeight * pdfWidth) / resultRef.current.offsetWidth;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(filename);
    } catch (e: unknown) {
      alert(`PDF 생성 중 오류가 발생했습니다: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const shareResult = (calculatorName: string, resultTotal: number) => {
    const text = `보상스쿨 ${calculatorName} 계산결과\n▶ 예상 합의금: ${resultTotal.toLocaleString()}원\n\n자세한 내역은 보상스쿨에서 확인해보세요!`;
     
    if (typeof window !== 'undefined' && (window as any).Kakao && (window as any).Kakao.isInitialized()) {
       
      (window as any).Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `보상스쿨 ${calculatorName} 결과`,
          description: `예상 합의금: ${resultTotal.toLocaleString()}원`,
          imageUrl: 'https://claim-works.com/og-image.png',
          link: { mobileWebUrl: window.location.href, webUrl: window.location.href }
        },
        buttons: [{ title: '결과 보기', link: { mobileWebUrl: window.location.href, webUrl: window.location.href } }],
      });
    } else if (navigator.share) {
      navigator.share({ title: `보상스쿨 ${calculatorName} 계산결과`, text: text, url: window.location.href }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text + '\n' + window.location.href);
      alert('결과가 클립보드에 복사되었습니다.');
    }
  };

  return { exportPDF, shareResult };
}
