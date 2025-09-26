import { AppState, LiftType, LiftState } from '../types';
import { getPlateBreakdown } from './calculator';

export const exportToCSV = (state: AppState) => {
    const { details, equipment, lifts } = state;
    const fields = [
        'eventName','lifterName','weightClass','competitionDate','weighInTime',
        'squatRackHeight','squatStands','benchRackHeight','handOut','benchSafetyHeight',
        'squat1','squat2','squat3','bench1','bench2','bench3','deadlift1','deadlift2','deadlift3'
    ];

    const liftWarmupFields: string[] = [];
    ['squat', 'bench', 'deadlift'].forEach(lift => {
        for(let i=0; i<8; i++){
            liftWarmupFields.push(`${lift}Warmup${i+1}Weight`, `${lift}Warmup${i+1}Reps`);
        }
    });

    const allFields = fields.concat(liftWarmupFields);
    
    const header = allFields.join(',');

    const data: Record<string, string> = {
        ...details,
        ...equipment,
        squat1: lifts.squat.attempts['1'],
        squat2: lifts.squat.attempts['2'],
        squat3: lifts.squat.attempts['3'],
        bench1: lifts.bench.attempts['1'],
        bench2: lifts.bench.attempts['2'],
        bench3: lifts.bench.attempts['3'],
        deadlift1: lifts.deadlift.attempts['1'],
        deadlift2: lifts.deadlift.attempts['2'],
        deadlift3: lifts.deadlift.attempts['3'],
    };

    lifts.squat.warmups.forEach((s, i) => { data[`squatWarmup${i+1}Weight`] = s.weight; data[`squatWarmup${i+1}Reps`] = s.reps; });
    lifts.bench.warmups.forEach((s, i) => { data[`benchWarmup${i+1}Weight`] = s.weight; data[`benchWarmup${i+1}Reps`] = s.reps; });
    lifts.deadlift.warmups.forEach((s, i) => { data[`deadliftWarmup${i+1}Weight`] = s.weight; data[`deadliftWarmup${i+1}Reps`] = s.reps; });

    const row = allFields.map(field => {
        const value = data[field] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');

    const blob = new Blob([header + '\n' + row], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const fileName = `${details.lifterName || 'Lifter'}_Competition_Plan.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const exportToPDF = (state: AppState) => {
    const { jsPDF } = (window as any).jspdf;
    if (!jsPDF) {
        alert("PDF library is not loaded.");
        return;
    }

    const { details, equipment, lifts } = state;
    const doc = new jsPDF('portrait', 'mm', 'a4');
    
    const pageWidth = 210;
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = margin;

    // --- MAIN HEADER ---
    doc.setFillColor(17, 24, 39); // bg-slate-900
    doc.rect(margin, yPos, contentWidth, 16, 'F');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('POWERLIFTING MEET PLAN', pageWidth / 2, yPos + 10, { align: 'center' });
    yPos += 16 + 6;

    // --- DETAILS & EQUIPMENT SECTION ---
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39);
    doc.text('Competition & Equipment Details', margin, yPos);
    yPos += 5;
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.line(margin, yPos, margin + contentWidth, yPos);
    yPos += 2;

    doc.setFontSize(10);
    doc.setTextColor(48, 48, 48);
    const detailCol1 = margin;
    const detailCol2 = margin + 95;
    const rowHeight = 7;
    const detailValueOffsetCol1 = 35;
    const detailValueOffsetCol2 = 45; // Increased offset for the second column

    const competitionDetails = [
        { label: 'Event Name', value: details.eventName },
        { label: 'Lifter Name', value: details.lifterName },
        { label: 'Weight Class', value: details.weightClass },
        { label: 'Competition Date', value: details.competitionDate },
        { label: 'Weigh-in Time', value: details.weighInTime },
    ];

    const equipmentDetails = [
        { label: 'Squat Rack Height', value: equipment.squatRackHeight },
        { label: 'Squat Stands', value: equipment.squatStands },
        { label: 'Bench Rack Height', value: equipment.benchRackHeight },
        { label: 'Bench Safety Height', value: equipment.benchSafetyHeight },
        { label: 'Hand Out', value: equipment.handOut },
    ];

    const maxRows = Math.max(competitionDetails.length, equipmentDetails.length);
    let currentY = yPos + 5;

    for (let i = 0; i < maxRows; i++) {
        // Zebra stripe
        if (i % 2 === 1) {
            doc.setFillColor(248, 250, 252); // slate-50
            doc.rect(margin, currentY - 4.5, contentWidth, rowHeight, 'F');
        }

        // Column 1
        if (competitionDetails[i]) {
            const { label, value } = competitionDetails[i];
            doc.setFont('helvetica', 'bold');
            doc.text(`${label}:`, detailCol1 + 2, currentY, { align: 'left' });
            doc.setFont('helvetica', 'normal');
            doc.text(value || 'N/A', detailCol1 + detailValueOffsetCol1, currentY, { align: 'left' });
        }

        // Column 2
        if (equipmentDetails[i]) {
            const { label, value } = equipmentDetails[i];
            doc.setFont('helvetica', 'bold');
            doc.text(`${label}:`, detailCol2 + 2, currentY, { align: 'left' });
            doc.setFont('helvetica', 'normal');
            doc.text(value || 'N/A', detailCol2 + detailValueOffsetCol2, currentY, { align: 'left' });
        }
        
        currentY += rowHeight;
    }

    yPos = currentY; // Set Y to be after the details section
    

    // --- LIFT SECTION DRAWING FUNCTION ---
    const drawLiftSection = (liftName: string, liftType: LiftType) => {
        const liftData = lifts[liftType];
        
        // Lift Header
        doc.setFillColor(30, 41, 59); // bg-slate-800
        doc.rect(margin, yPos, contentWidth, 9, 'F');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(liftName.toUpperCase(), margin + 5, yPos + 6.5);
        yPos += 9 + 4;

        // Attempts & Warmups side-by-side
        const attemptsWidth = 60;
        const warmupsWidth = contentWidth - attemptsWidth - 5;
        const attemptsX = margin;
        const warmupsX = margin + attemptsWidth + 5;
        let attemptsY = yPos;
        let warmupsY = yPos;
        const cbSize = 4; // Checkbox size

        // Draw Attempts Box
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text('Attempts', attemptsX, attemptsY);
        attemptsY += 5;

        const attempts: Array<{key: '1' | '2' | '3', label: string}> = [
            { key: '1', label: 'Opener' }, { key: '2', label: 'Second' }, { key: '3', label: 'Third' },
        ];
        
        attempts.forEach((attempt, index) => {
            if (index % 2 === 1) {
                doc.setFillColor(248, 250, 252); // slate-50
                doc.rect(attemptsX, attemptsY - 4, attemptsWidth, 6, 'F');
            }
            
            // Add checkbox
            const attemptCb = new (doc as any).AcroForm.CheckBox();
            attemptCb.fieldName = `${liftType}-attempt-${index}`;
            attemptCb.Rect = [attemptsX, attemptsY - 3.5, cbSize, cbSize];
            attemptCb.V = '/Off'; // Set Value to Off
            attemptCb.AS = '/Off'; // Set Appearance State to Off
            doc.addField(attemptCb);

            doc.setFontSize(11);
            doc.setTextColor(48, 48, 48);
            doc.setFont('helvetica', 'normal');
            doc.text(`${attempt.label}:`, attemptsX + cbSize + 2, attemptsY);
            doc.setFont('helvetica', 'bold');
            doc.text(`${liftData.attempts[attempt.key] || '___'} kg`, attemptsX + attemptsWidth - 2, attemptsY, { align: 'right' });
            attemptsY += 6;
        });

        // Draw Warmups Box
        const populatedWarmups = liftData.warmups.filter(w => w.weight && w.reps);
        if (populatedWarmups.length > 0) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(17, 24, 39);
            doc.text('Warm-ups', warmupsX, warmupsY);
            if (liftData.includeCollars) {
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text('(w/ 5kg collars)', warmupsX + 22, warmupsY);
            }
            warmupsY += 5;

            // Header
            doc.setFillColor(241, 245, 249); // slate-100
            doc.rect(warmupsX, warmupsY - 3, warmupsWidth, 5, 'F');
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139); // slate-500
            doc.setFont('helvetica', 'bold');
            const weightColX = warmupsX + cbSize + 4;
            const repsColX = weightColX + 18;
            const loadingColX = repsColX + 15;
            doc.text('Weight', weightColX, warmupsY);
            doc.text('Reps', repsColX, warmupsY);
            doc.text('Plate Loading (per side)', loadingColX, warmupsY);
            warmupsY += 5;

            // Rows
            populatedWarmups.forEach((set, index) => {
                const weight = parseFloat(set.weight);
                const plateBreakdown = !isNaN(weight) ? getPlateBreakdown(weight, liftData.includeCollars) : 'N/A';
                
                if (index % 2 === 1) {
                    doc.setFillColor(248, 250, 252); // slate-50
                    doc.rect(warmupsX, warmupsY - 4, warmupsWidth, 6, 'F');
                }
                
                // Add checkbox
                const warmupCb = new (doc as any).AcroForm.CheckBox();
                warmupCb.fieldName = `${liftType}-warmup-${index}`;
                warmupCb.Rect = [warmupsX, warmupsY - 3.5, cbSize, cbSize];
                warmupCb.V = '/Off'; // Set Value to Off
                warmupCb.AS = '/Off'; // Set Appearance State to Off
                doc.addField(warmupCb);

                doc.setFontSize(10);
                doc.setTextColor(48, 48, 48);
                doc.setFont('helvetica', 'normal');
                doc.text(`${set.weight} kg`, weightColX, warmupsY);
                doc.text(`x ${set.reps}`, repsColX, warmupsY);
                
                const plateFontSize = plateBreakdown.length > 20 ? 8 : 9;
                doc.setFontSize(plateFontSize);
                doc.text(plateBreakdown, loadingColX, warmupsY);
                
                warmupsY += 6;
            });
        }
        
        const populatedCues = liftData.cues.filter(c => c.trim() !== '');
        if (populatedCues.length > 0) {
            warmupsY += 4; // Add a little space
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(17, 24, 39);
            doc.text('Technical Cues:', warmupsX, warmupsY);
            warmupsY += 5;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(48, 48, 48);
            populatedCues.forEach(cue => {
                doc.text(`• ${cue}`, warmupsX + 2, warmupsY);
                warmupsY += 5;
            });
        }

        yPos = Math.max(attemptsY, warmupsY) + 6; // Set Y to be after the longest column
    };
    
    drawLiftSection('Squat', 'squat');
    drawLiftSection('Bench Press', 'bench');
    drawLiftSection('Deadlift', 'deadlift');

    const fileName = `${details.lifterName || 'Lifter'}_Competition_Plan.pdf`;
    doc.save(fileName);
};


export const exportToMobilePDF = (state: AppState) => {
    const { jsPDF } = (window as any).jspdf;
    if (!jsPDF) {
        alert("PDF library is not loaded.");
        return;
    }

    const { details, equipment, lifts } = state;
    const doc = new jsPDF('portrait', 'mm', 'a4');
    
    const pageWidth = 210;
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    // --- PAGE 1: DETAILS & EQUIPMENT ---
    let yPos = margin;

    // Header
    doc.setFillColor(17, 24, 39);
    doc.rect(margin, yPos, contentWidth, 20, 'F');
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('MEET PLAN', pageWidth / 2, yPos + 13, { align: 'center' });
    yPos += 20 + 12;

    // Details Section
    doc.setFontSize(22);
    doc.setTextColor(17, 24, 39);
    doc.text('Competition Details', pageWidth / 2, yPos, { align: 'center'});
    yPos += 12;

    const competitionDetails = [
        { label: 'Event Name', value: details.eventName },
        { label: 'Lifter Name', value: details.lifterName },
        { label: 'Weight Class', value: details.weightClass },
        { label: 'Competition Date', value: details.competitionDate },
        { label: 'Weigh-in Time', value: details.weighInTime },
    ];

    const equipmentDetails = [
        { label: 'Squat Rack Height', value: equipment.squatRackHeight },
        { label: 'Squat Stands', value: equipment.squatStands },
        { label: 'Bench Rack Height', value: equipment.benchRackHeight },
        { label: 'Bench Safety Height', value: equipment.benchSafetyHeight },
        { label: 'Hand Out', value: equipment.handOut },
    ];
    
    const rowHeight = 18;
    const valueOffset = 70;
    
    doc.setFontSize(16);

    // Competition Details
    competitionDetails.forEach((detail, index) => {
        if (index % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, yPos - 12.5, contentWidth, rowHeight, 'F');
        }
        doc.setTextColor(100, 116, 139); // slate-500
        doc.setFont('helvetica', 'bold');
        doc.text(`${detail.label}:`, margin + 2, yPos);
        
        doc.setTextColor(17, 24, 39);
        doc.setFont('helvetica', 'normal');
        doc.text(detail.value || 'N/A', margin + valueOffset, yPos);
        yPos += rowHeight;
    });

    // Separator
    yPos += 8;
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(margin + 5, yPos, margin + contentWidth - 5, yPos);
    yPos += 8;
    
    doc.setFontSize(22);
    doc.setTextColor(17, 24, 39);
    doc.text('Equipment Settings', pageWidth / 2, yPos, { align: 'center'});
    yPos += 12;
    
    // Equipment Details
    doc.setFontSize(16);
    equipmentDetails.forEach((detail, index) => {
        if (index % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, yPos - 12.5, contentWidth, rowHeight, 'F');
        }
        doc.setTextColor(100, 116, 139); // slate-500
        doc.setFont('helvetica', 'bold');
        doc.text(`${detail.label}:`, margin + 2, yPos);
        
        doc.setTextColor(17, 24, 39);
        doc.setFont('helvetica', 'normal');
        doc.text(detail.value || 'N/A', margin + valueOffset, yPos);
        yPos += rowHeight;
    });

    // --- LIFT PAGES ---
    const drawMobileLiftPage = (liftName: string, liftType: LiftType, liftData: LiftState) => {
        doc.addPage();
        let pageY = margin;
        
        // Lift Header
        doc.setFillColor(30, 41, 59);
        doc.rect(margin, pageY, contentWidth, 16, 'F');
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(liftName.toUpperCase(), pageWidth / 2, pageY + 11, { align: 'center' });
        pageY += 16 + 12;

        const cbSize = 8;

        // Attempts Section
        doc.setFontSize(18);
        doc.setTextColor(17, 24, 39);
        doc.text('Attempts', margin, pageY);
        pageY += 10;

        const attempts: Array<{key: '1' | '2' | '3', label: string}> = [
            { key: '1', label: 'Opener' }, { key: '2', label: 'Second' }, { key: '3', label: 'Third' },
        ];
        
        const attemptRowHeight = 16;
        attempts.forEach((attempt, index) => {
            if (index % 2 === 1) {
                doc.setFillColor(248, 250, 252);
                doc.rect(margin, pageY - 10, contentWidth, attemptRowHeight, 'F');
            }
            
            const cbY = pageY - 6;
            doc.setDrawColor(30, 41, 59);
            doc.setLineWidth(0.8);
            doc.rect(margin, cbY, cbSize, cbSize, 'S');

            const attemptCb = new (doc as any).AcroForm.CheckBox();
            attemptCb.fieldName = `mobile-${liftType}-attempt-${index}`;
            attemptCb.Rect = [margin, cbY, cbSize, cbSize];
            attemptCb.V = '/Off'; attemptCb.AS = '/Off';
            doc.addField(attemptCb);

            doc.setFontSize(16);
            doc.setTextColor(48, 48, 48);
            doc.setFont('helvetica', 'normal');
            doc.text(`${attempt.label}:`, margin + cbSize + 4, pageY);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.text(`${liftData.attempts[attempt.key] || '___'} kg`, margin + contentWidth, pageY, { align: 'right' });
            pageY += attemptRowHeight;
        });

        pageY += 15; // Space between sections

        // Warmups Section
        const populatedWarmups = liftData.warmups.filter(w => w.weight && w.reps);
        if (populatedWarmups.length > 0) {
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(17, 24, 39);
            doc.text('Warm-ups', margin, pageY);
            if (liftData.includeCollars) {
                doc.setFontSize(11);
                doc.setTextColor(100, 116, 139);
                doc.text('(with 5kg collars)', margin + 35, pageY);
            }
            pageY += 10;

            // Header
            const warmupHeaderHeight = 8;
            doc.setFillColor(241, 245, 249);
            doc.rect(margin, pageY - 6, contentWidth, warmupHeaderHeight, 'F');
            doc.setFontSize(12);
            doc.setTextColor(100, 116, 139);
            const weightColX = margin + cbSize + 5;
            const repsColX = weightColX + 30;
            const loadingColX = repsColX + 25;
            doc.text('Weight', weightColX, pageY);
            doc.text('Reps', repsColX, pageY);
            doc.text('Plate Loading (per side)', loadingColX, pageY);
            pageY += warmupHeaderHeight + 2;

            // Rows
            const warmupRowHeight = 16;
            populatedWarmups.forEach((set, index) => {
                const weight = parseFloat(set.weight);
                const plateBreakdown = !isNaN(weight) ? getPlateBreakdown(weight, liftData.includeCollars) : 'N/A';
                
                if (index % 2 === 1) {
                    doc.setFillColor(248, 250, 252);
                    doc.rect(margin, pageY - 10.5, contentWidth, warmupRowHeight, 'F');
                }
                
                const cbY = pageY - 7;
                doc.setDrawColor(30, 41, 59);
                doc.setLineWidth(0.8);
                doc.rect(margin, cbY, cbSize, cbSize, 'S');

                const warmupCb = new (doc as any).AcroForm.CheckBox();
                warmupCb.fieldName = `mobile-${liftType}-warmup-${index}`;
                warmupCb.Rect = [margin, cbY, cbSize, cbSize];
                warmupCb.V = '/Off'; warmupCb.AS = '/Off';
                doc.addField(warmupCb);

                doc.setFontSize(19);
                doc.setTextColor(48, 48, 48);

                doc.setFont('helvetica', 'bold');
                doc.text(`${set.weight} kg`, weightColX, pageY);
                
                doc.setFont('helvetica', 'normal');
                doc.text(`x ${set.reps}`, repsColX, pageY);
                
                doc.setFontSize(16);
                doc.text(plateBreakdown, loadingColX, pageY);
                
                pageY += warmupRowHeight;
            });
        }

        // Cues Section
        const populatedCues = liftData.cues.filter(c => c.trim() !== '');
        if (populatedCues.length > 0) {
            pageY += 15;
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(17, 24, 39);
            doc.text('Technical Cues', margin, pageY);
            pageY += 10;

            const cueRowHeight = 12;
            doc.setFontSize(16);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(48, 48, 48);

            populatedCues.forEach((cue, index) => {
                 if (index % 2 === 1) {
                    doc.setFillColor(248, 250, 252);
                    doc.rect(margin, pageY - 9, contentWidth, cueRowHeight, 'F');
                }
                doc.text(`• ${cue}`, margin + 2, pageY);
                pageY += cueRowHeight;
            });
        }
    };
    
    drawMobileLiftPage('Squat', 'squat', lifts.squat);
    drawMobileLiftPage('Bench Press', 'bench', lifts.bench);
    drawMobileLiftPage('Deadlift', 'deadlift', lifts.deadlift);

    const fileName = `${details.lifterName || 'Lifter'}_Competition_Plan_Mobile.pdf`;
    doc.save(fileName);
};
