import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontRegular = '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf';
const fontBold = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf';
const fontItalic = '/usr/share/fonts/truetype/liberation/LiberationSans-Italic.ttf';
const fontBoldItalic = '/usr/share/fonts/truetype/liberation/LiberationSans-BoldItalic.ttf';

const outputPath = path.join(__dirname, 'huong_dan_controller.pdf');

class PDFGuideGenerator {
    constructor() {
        this.doc = new PDFDocument({
            size: 'A4',
            margins: { top: 40, bottom: 40, left: 40, right: 40 },
            bufferPages: true,
            info: {
                Title: 'SO TAY HUONG DAN SU DUNG BAN DIEU KHIEN CONTROLLER',
                Author: 'Ban To Chuc Duong Den Vinh Quang',
                Subject: 'Tai lieu chi tiet quy trinh thao tac ky thuat va van hanh tran dau',
                Keywords: 'controller, huong dan, duong den vinh quang, thao tac nut bam'
            }
        });
        this.writeStream = fs.createWriteStream(outputPath);
        this.doc.pipe(this.writeStream);
    }

    drawHeaderFooter(pageNumber, totalPages) {
        if (pageNumber === 1) return; // Khong ve header footer trang bia

        const doc = this.doc;
        doc.save();
        
        // Header
        doc.font(fontRegular).fontSize(8).fillColor('#64748b');
        doc.text('DUONG DEN VINH QUANG - SO TAY DIEU HANH BAN DIEU KHIEN (CONTROLLER)', 40, 22, { width: 515, align: 'left' });
        doc.text('HE THONG THI DAU 2026', 40, 22, { width: 515, align: 'right' });
        doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(40, 32).lineTo(555, 32).stroke();

        // Footer
        doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(40, 802).lineTo(555, 802).stroke();
        doc.font(fontRegular).fontSize(8).fillColor('#64748b');
        doc.text('Tai lieu chi tiet tung nut bam va quy trinh danh cho Ky thuat vien & Thu ky', 40, 808, { width: 420, align: 'left' });
        doc.font(fontBold).text(`Trang ${pageNumber} / ${totalPages}`, 40, 808, { width: 515, align: 'right' });
        
        doc.restore();
    }

    addCoverPage() {
        const doc = this.doc;
        
        // Nen trang bia mau xanh den lich su
        doc.rect(0, 0, 595.28, 841.89).fill('#0f172a');
        
        // Khung vien
        doc.rect(25, 25, 545.28, 791.89).strokeColor('#eab308').lineWidth(2).stroke();
        doc.rect(30, 30, 535.28, 781.89).strokeColor('#334155').lineWidth(1).stroke();

        // Nhan dau trang
        doc.rect(160, 65, 275, 28).fill('#1e293b');
        doc.font(fontBold).fontSize(10.5).fillColor('#facc15');
        doc.text('HE THONG QUAN TRI VA DIEU HANH GAMESHOW', 40, 74, { align: 'center' });

        // Tieu de lon
        doc.moveDown(4.2);
        doc.font(fontBold).fontSize(25).fillColor('#ffffff');
        doc.text('DUONG DEN VINH QUANG', { align: 'center' });

        doc.moveDown(0.4);
        doc.font(fontBold).fontSize(16.5).fillColor('#38bdf8');
        doc.text('SO TAY HUONG DAN CHI TIET', { align: 'center' });
        doc.font(fontBold).fontSize(14).fillColor('#f59e0b');
        doc.text('QUY TRINH BAM NUT VA THAO TAC BAN DIEU KHIEN', { align: 'center' });

        // Duong gach phan cach
        doc.moveDown(1.5);
        doc.strokeColor('#e2e8f0').lineWidth(1.2).moveTo(140, doc.y).lineTo(455, doc.y).stroke();

        // Khung tich hop thong tin tong quan
        doc.moveDown(2);
        const boxY = doc.y;
        doc.roundedRect(55, boxY, 485, 180, 6).fill('#1e293b');
        doc.rect(55, boxY, 485, 180).strokeColor('#475569').lineWidth(1).stroke();

        doc.font(fontBold).fontSize(10.5).fillColor('#38bdf8');
        doc.text('NOI DUNG TAI LIEU NAY HUONG DAN CU THE:', 75, boxY + 14);
        
        const bulletPoints = [
            'Huong dan chi tiet tung nut bam tren giao dien Controller (vi tri, chuc nang, he qua).',
            'Quy trinh chuan tung buoc (Step-by-step) cho 4 vong thi: Xuat Phat, Ra Khoi, Vuot Song, Vinh Quang.',
            'Cach van hanh thang diem moi: Vong Ra Khoi (40 - 30 - 20 - 10 diem) va Vong Vuot Song (50 - 40 - 30 - 20 - 10 diem).',
            'Cach su dung cong cu cham diem tu dong theo thoi gian nop bai va chuong bam giay.',
            'Thao tac xu ly su co: Chinh sua diem truc tiep, dong bo lai man hinh va ngat am thanh khan cap.'
        ];

        let curY = boxY + 34;
        bulletPoints.forEach((pt, idx) => {
            doc.font(fontBold).fontSize(10).fillColor('#facc15').text(`[${idx + 1}]`, 75, curY);
            doc.font(fontRegular).fontSize(9.5).fillColor('#e2e8f0').text(pt, 98, curY, { width: 422, lineGap: 2 });
            curY += 26;
        });

        // Thong tin ban quyen va luu y
        doc.font(fontBold).fontSize(10).fillColor('#94a3b8');
        doc.text('PHIEN BAN HE THONG: V3.5 PRO - NAM 2026', 40, 685, { align: 'center' });
        doc.font(fontRegular).fontSize(9.5).fillColor('#64748b');
        doc.text('Tai lieu danh cho: Dao dien ky thuat, Ky thuat vien van hanh may chu, Thu ky hoi dong', 40, 703, { align: 'center' });
        doc.font(fontItalic).fontSize(8.5).fillColor('#475569');
        doc.text('Khong pho bien ma PIN va mat khau phong thi cho thi sinh', 40, 720, { align: 'center' });
    }

    addSectionHeader(number, title, subtitle) {
        const doc = this.doc;
        doc.moveDown(0.8);
        
        if (doc.y > 670) {
            doc.addPage();
        }

        const y = doc.y;
        doc.roundedRect(40, y, 515, 28, 3).fill('#1e3a8a');
        doc.font(fontBold).fontSize(11.5).fillColor('#ffffff');
        doc.text(`${number}. ${title.toUpperCase()}`, 52, y + 8);

        if (subtitle) {
            doc.font(fontItalic).fontSize(8.5).fillColor('#93c5fd');
            doc.text(subtitle, 320, y + 9, { width: 225, align: 'right' });
        }

        doc.y = y + 36;
    }

    addSubHeader(title) {
        const doc = this.doc;
        if (doc.y > 700) doc.addPage();
        doc.moveDown(0.5);
        doc.font(fontBold).fontSize(10.5).fillColor('#0369a1');
        doc.text(`>>> ${title}`);
        doc.moveDown(0.2);
    }

    addParagraph(text) {
        const doc = this.doc;
        if (doc.y > 730) doc.addPage();
        doc.font(fontRegular).fontSize(9.2).fillColor('#1e293b').lineGap(2);
        doc.text(text, { width: 515, align: 'justify' });
        doc.moveDown(0.3);
    }

    addCallout(title, text, type = 'info') {
        const doc = this.doc;
        if (doc.y > 690) doc.addPage();
        
        const y = doc.y;
        let bgColor = '#f8fafc';
        let borderColor = '#94a3b8';
        let titleColor = '#0f172a';

        if (type === 'tip') {
            bgColor = '#ecfdf5';
            borderColor = '#10b981';
            titleColor = '#065f46';
        } else if (type === 'warning') {
            bgColor = '#fffbeb';
            borderColor = '#f59e0b';
            titleColor = '#92400e';
        } else if (type === 'score') {
            bgColor = '#f5f3ff';
            borderColor = '#8b5cf6';
            titleColor = '#5b21b6';
        }

        doc.roundedRect(40, y, 515, 42, 3).fill(bgColor);
        doc.strokeColor(borderColor).lineWidth(1.2).moveTo(40, y).lineTo(40, y + 42).stroke();

        doc.font(fontBold).fontSize(9).fillColor(titleColor);
        doc.text(`[ ${title} ]`, 52, y + 6);

        doc.font(fontRegular).fontSize(8.5).fillColor('#334155');
        doc.text(text, 52, y + 19, { width: 492, lineGap: 1.5 });

        doc.y = y + 48;
    }

    addStep(stepNum, title, desc, actionNote) {
        const doc = this.doc;
        if (doc.y > 715) doc.addPage();
        
        const y = doc.y;
        // Step box
        doc.roundedRect(40, y, 22, 18, 3).fill('#0284c7');
        doc.font(fontBold).fontSize(8.5).fillColor('#ffffff').text(`B${stepNum}`, 40, y + 4, { width: 22, align: 'center' });

        doc.font(fontBold).fontSize(9.5).fillColor('#0f172a').text(title, 70, y + 2);
        
        let curY = y + 16;
        doc.font(fontRegular).fontSize(8.7).fillColor('#334155').text(desc, 70, curY, { width: 480, lineGap: 1.5 });
        curY = doc.y + 1;

        if (actionNote) {
            doc.font(fontBoldItalic).fontSize(8.2).fillColor('#b45309').text(`-> Thao tac: ${actionNote}`, 70, curY, { width: 480 });
            curY = doc.y + 2;
        }

        doc.y = curY + 4;
    }

    addScoreTable(roundName, rows) {
        const doc = this.doc;
        if (doc.y > 670) doc.addPage();
        
        const startY = doc.y + 2;
        doc.font(fontBold).fontSize(9.5).fillColor('#1e3a8a');
        doc.text(`BANG THANG DIEM CHI TIET: ${roundName.toUpperCase()}`, 40, startY);
        
        const tableY = startY + 14;
        doc.rect(40, tableY, 515, 18).fill('#334155');
        doc.font(fontBold).fontSize(8.2).fillColor('#ffffff');
        doc.text('HANG MUC / TRUONG HOP', 48, tableY + 5, { width: 175 });
        doc.text('DIEM CONG', 225, tableY + 5, { width: 75, align: 'center' });
        doc.text('NUT BAM TUONG UNG TREN GIAO DIEN', 310, tableY + 5, { width: 155 });
        doc.text('QUY TAC AP DUNG', 475, tableY + 5, { width: 75 });

        let curY = tableY + 18;
        rows.forEach((r, idx) => {
            const bg = (idx % 2 === 0) ? '#f8fafc' : '#ffffff';
            doc.rect(40, curY, 515, 18).fill(bg);
            doc.strokeColor('#e2e8f0').lineWidth(0.5).rect(40, curY, 515, 18).stroke();

            doc.font(fontBold).fontSize(8).fillColor('#0f172a').text(r[0], 48, curY + 4, { width: 175 });
            doc.font(fontBold).fontSize(8.5).fillColor(r[3] || '#16a34a').text(r[1], 225, curY + 4, { width: 75, align: 'center' });
            doc.font(fontRegular).fontSize(7.8).fillColor('#1e293b').text(r[2], 310, curY + 4, { width: 155 });
            doc.font(fontItalic).fontSize(7.5).fillColor('#64748b').text(r[4] || 'Chuan', 475, curY + 4, { width: 75 });
            curY += 18;
        });

        doc.y = curY + 8;
    }

    generate() {
        // Trang 1: Bia
        this.addCoverPage();

        // Trang 2: Thanh dieu huong, reload role va Tab 0 (He thong)
        this.doc.addPage();
        this.addSectionHeader(1, 'Thanh dieu huong va chuc nang reload role', 'Khu vuc dau trang');
        
        this.addParagraph('Khu vuc dau trang tren Controller chua cac nut chuyen tab vong thi va bo cong cu tai lai man hinh tu xa (Reload Role). Ky thuat vien can nam ro chuc nang cua tung nut:');

        this.addSubHeader('Cac nut chuyen Tab vong thi:');
        this.addParagraph('- Nut [HE THONG]: Mo man hinh cai dat tong the, quan ly de thi, thong tin thi sinh va ket noi mang.\n' +
            '- Nut [XUAT PHAT]: Mo giao dien dieu khien vong thi Xuat Phat (Khoi dong ca nhan 60 giay).\n' +
            '- Nut [RA KHOI]: Mo giao dien dieu khien vong thi Ra Khoi (Tang toc voi thang diem 40-30-20-10).\n' +
            '- Nut [VUOT SONG]: Mo giao dien dieu khien vong thi Vuot Song (Vuot chuong ngai vat voi thang diem 50-10).\n' +
            '- Nut [VINH QUANG]: Mo giao dien dieu khien vong thi Vinh Quang (Ve dich, goi cau hoi va ngoi sao hy vong).\n' +
            '- Nut [CAU HOI PHU]: Mo giao dien dieu khien cau hoi phu phan dinh thang thua khi dong diem.');

        this.addSubHeader('Cac nut tren thanh Reload Role (Lam moi man hinh khong mat du lieu):');
        this.addParagraph('- Nut [TAT CA]: Gui lenh tai lai (F5 tu xa) toan bo cac may dang ket noi gom May Chieu, MC, Graphic va 4 may Thi sinh.\n' +
            '- Nut [4 TS]: Gui lenh tai lai dong thoi ca 4 may thi sinh (TS1, TS2, TS3, TS4).\n' +
            '- Cac nut [TS1], [TS2], [TS3], [TS4]: Gui lenh tai lai rieng biet cho tung thi sinh neu may do bi lag hoac mat ket noi.\n' +
            '- Nut [MC]: Tai lai man hinh cua Nguoi dan chuong trinh.\n' +
            '- Nut [MAY CHIEU]: Tai lai man hinh may chieu san khau (Projector).\n' +
            '- Nut [GRAPHIC]: Tai lai man hinh do hoa livestream / OBS.\n' +
            '- Nut [TAI PDF] va [HUONG DAN]: Mo tai lieu huong dan va file PDF nay.');

        this.addSectionHeader(2, 'Tab 0: He Thong - Quy trinh chuan bi truoc tran dau', 'Setup');
        this.addStep(1, 'Nhap danh sach 4 thi sinh', 
            'Dien Ho va ten, Truong hoac Lop vao 4 o: TS1, TS2, TS3, TS4 o khung Thong Tin Thi Sinh.', 
            'Nhap truc tiep vao o text, sau do bam nut [Luu du lieu] de cap nhat.');

        this.addStep(2, 'Nap ngan hang cau hoi bang file Excel', 
            'Bam nut [Tai file mau Excel] de lay template chuan. Dien day du cau hoi va dap an 4 vong. Sau do bam nut [Chon tep] va bam [Nap file cau hoi Excel].', 
            'Kiem tra thong bao "Da nap thanh cong cau hoi" tren man hinh.');

        this.addStep(3, 'Huong dan thi sinh dang nhap', 
            'Cho 4 thi sinh quet ma QR tuong ung tai khung Ket Noi Thi Sinh hoac truy cap dia chi duoc hien thi, nhap Room Code va PIN rieng cua tung vi tri.', 
            'Kiem tra den tin hieu TS1, TS2, TS3, TS4 tren thanh trang thai: Chuyen sang mau XANH LA CAY la ket noi tot.');

        this.addStep(4, 'Bat dau vong thi (Chuyen canh dong bo)', 
            'Khi MC gioi thieu bat dau vong thi nao, bam nut [Bat dau vong thi] tuong ung tai bang dieu khien de tat ca cac may cung chuyen sang vong do.', 
            'Bam nut [Bat dau vong thi] cua vong can dau.');

        // Trang 3: Vong 1 (Xuat Phat) va Vong 2 (Ra Khoi)
        this.doc.addPage();
        this.addSectionHeader(3, 'Vong 1: Xuat Phat - Thao tac chi tiet tung giay', 'Khoi dong 60s');
        this.addParagraph('Moi thi sinh co 60 giay de tra loi goi cau hoi ca nhan. Dung moi cau duoc +10 diem, sai khong bi tru diem.');

        this.addStep(1, 'Chon thi sinh chuan bi thi dau', 
            'Bam vao the thi sinh [Thí sinh 1] (hoac 2, 3, 4). Man hinh hien thi ten va so diem hien tai cua thi sinh do.', 
            'Bam vao the ten thi sinh o hang tren cung cua Tab Xuat Phat.');

        this.addStep(2, 'Khoi dong dong ho 60 giay', 
            'Khi MC doc hieu lenh bat dau, bam nut [Bat dau 60s]. Dong ho tren tat ca man hinh bat dau dem nguoc, am thanh nhac nen bat dau phat va cau hoi so 1 hien ra tren man hinh MC va may chieu.', 
            'Bam nut [Bat dau 60s] (nut mau xanh duong).');

        this.addStep(3, 'Xu ly khi thi sinh doc cau tra loi', 
            'Neu thi sinh tra loi DUNG: Bam nut [DUNG (+10d)] -> He thong phat tieng chuong dung, tu dong cong 10 diem va nhay sang cau tiep theo.\n' +
            'Neu thi sinh tra loi SAI hoac BO QUA: Bam nut [SAI / BO QUA] -> He thong phat tieng coi sai, khong cong diem va chuyen sang cau tiep theo.', 
            'Bam [DUNG (+10d)] (nut mau xanh la) hoac [SAI / BO QUA] (nut mau do).');

        this.addStep(4, 'Ket thuc luot thi', 
            'Dong ho ve 00s he thong tu dong phat am thanh ket thuc luot thi. Neu con cau hoi chua doc kip, bam nut [Dung dong ho] hoac [Hien tong diem] de chot diem luot thi do.', 
            'Bam the thi sinh tiep theo de thuc hien luot thi moi.');

        this.addSectionHeader(4, 'Vong 2: Ra Khoi - Thang diem moi 40 - 30 - 20 - 10', 'Tang toc Media');
        this.addParagraph('Vong Ra Khoi gom 4 cau hoi co kem video/clip/hinh anh. Ca 4 thi sinh cung tra loi trong 30 giay. Thang diem ap dung theo toc do nop bai dung:');

        this.addScoreTable('Vong 2: Ra Khoi (Tang Toc)', [
            ['Thi sinh tra loi dung NHANH NHAT (Hang 1)', '+40 diem', 'Nut [+40] hoac Nut Cham diem tu dong', '#1e3a8a', 'Toc do 1'],
            ['Thi sinh tra loi dung NHANH THU 2 (Hang 2)', '+30 diem', 'Nut [+30] hoac Nut Cham diem tu dong', '#2563eb', 'Toc do 2'],
            ['Thi sinh tra loi dung NHANH THU 3 (Hang 3)', '+20 diem', 'Nut [+20] hoac Nut Cham diem tu dong', '#16a34a', 'Toc do 3'],
            ['Thi sinh tra loi dung NHANH THU 4 (Hang 4)', '+10 diem', 'Nut [+10] hoac Nut Cham diem tu dong', '#ca8a04', 'Toc do 4']
        ]);

        this.addSubHeader('Quy trinh bam nut chuan 6 buoc cho moi cau hoi Ra Khoi:');
        this.addStep(1, 'Chon cau hoi thi dau', 
            'Bam chon nut [Cau 1] (hoac Cau 2, Cau 3, Cau 4) tren thanh chon cau hoi.', 
            'Nhieu nut mau xanh noi len cho biet cau hoi da san sang.');

        this.addStep(2, 'Phat clip / Hien thi noi dung cau hoi', 
            'Bam nut [Phat clip / Hien cau hoi]. Video hoac hinh anh se hien len tren may chieu va man hinh 4 thi sinh.', 
            'Bam nut [Phat clip / Hien cau hoi].');

        this.addStep(3, 'Khoi dong 30 giay dem nguoc', 
            'Sau khi MC doc xong cau hoi hoac sau khi phat clip xong, bam nut [Bat dau 30s]. Dong ho chay nguoc, am thanh tang toc vang len, 4 may thi sinh mo o nhap dap an.', 
            'Bam nut [Bat dau 30s] (nut mau xanh dam).');

        this.addStep(4, 'Hien thi dap an cua 4 thi sinh', 
            'Khi dong ho ve 00s hoac tat ca da bam nop bai, bam nut [Hien dap an thi sinh]. Man hinh may chieu se dong loat hien 4 khung chua cau tra loi va thoi gian nop (vi du: 03.45s, 08.12s).', 
            'Bam nut [Hien dap an thi sinh].');

        this.addStep(5, 'Cham diem bang cong cu tu dong thong minh (Khuyen dung)', 
            'Bam nut [Cham diem (40-30-20-10)]. Hop thoai xuat hien hien thi dap an dung va danh sach 4 thi sinh da duoc he thong tu dong sap xep theo thoi gian nop tu nhanh nhat den cham nhat.\n' +
            'Nguoi dieu khien chi can nhap so thi sinh tra loi dung (vi du: 1, 3 hoac 2, 4) roi bam OK. He thong se tu dong cong 40 diem cho nguoi nhanh nhat trong so nguoi dung, 30 diem cho nguoi tiep theo, 20 diem va 10 diem.', 
            'Bam nut [Cham diem (40-30-20-10)] -> Nhap so thi sinh dung -> Bam OK.');

        this.addStep(6, 'Cap nhat va hien thi bang diem', 
            'Bam nut [Diem TS] de hien thi bang tong diem sau cau hoi vua roi len man hinh may chieu.', 
            'Bam nut [Diem TS].');

        // Trang 4: Vong 3 (Vuot Song)
        this.doc.addPage();
        this.addSectionHeader(5, 'Vong 3: Vuot Song - Hang ngang va Dap an vong thi', 'Vuot chuong ngai vat');
        this.addParagraph('Vong Vuot Song gom 4 cau hoi hang ngang, 1 cau hoi o trung tam va 1 Tu khoa / Dap an vong thi. Thi sinh co quyen bam chuong xin tra loi Tu khoa bat cu luc nao.');

        this.addScoreTable('Vong 3: Thang Diem Dap An Vong Thi (Tu Khoa)', [
            ['Thoi diem 1: Truoc/trong khi mo Hang ngang 1', '+50 diem', 'Nut [+50] hoac Nut Cham DA vong thi', '#dc2626', 'Moc 50d'],
            ['Thoi diem 2: Sau Hang ngang 1 / Truoc HN 2', '+40 diem', 'Nut [+40] hoac Nut Cham DA vong thi', '#ea580c', 'Moc 40d'],
            ['Thoi diem 3: Sau Hang ngang 2 / Truoc HN 3', '+30 diem', 'Nut [+30] hoac Nut Cham DA vong thi', '#2563eb', 'Moc 30d'],
            ['Thoi diem 4: Sau Hang ngang 3 / Truoc HN 4', '+20 diem', 'Nut [+20] hoac Nut Cham DA vong thi', '#0284c7', 'Moc 20d'],
            ['Thoi diem 5: Sau Hang ngang 4 / O trung tam', '+10 diem', 'Nut [+10] hoac Nut Cham DA vong thi', '#16a34a', 'Moc 10d'],
            ['Tra loi dung 1 cau hoi Hang ngang', '+10 diem', 'Nut [+10] hoac [Cong 10d ca 4 TS]', '#16a34a', 'Moi cau']
        ]);

        this.addSubHeader('Cac thao tac dieu khien cau hoi Hang ngang (H1 den H4):');
        this.addStep(1, 'Chon hang ngang can thi dau', 
            'Bam chon hang ngang do thi sinh hoac MC lua chon: Bam vao nut [H1], [H2], [H3], [H4] hoac [Trung tam]. Hang ngang duoc chon se sang den tren may chieu.', 
            'Bam nut [H1] (hoac H2, H3, H4, Trung tam).');

        this.addStep(2, 'Bat dau 20 giay suy nghi', 
            'Bam nut [Bat dau 20s]. Cau hoi hang ngang hien len tren may chieu va man hinh thi sinh. Thi sinh co 20 giay go dap an.', 
            'Bam nut [Bat dau 20s] (nut mau xanh duong).');

        this.addStep(3, 'Hien dap an thi sinh va mo o chu hang ngang', 
            'Hao gio, bam nut [Hien dap an thi sinh] de kiem tra cau tra loi cua 4 thi sinh. Sau do bam nut [Mo dap an hang ngang] de lat mo cac chu cai dap an tren man hinh may chieu.', 
            'Bam nut [Hien dap an thi sinh] -> Bam nut [Mo dap an hang ngang].');

        this.addStep(4, 'Cong diem hang ngang', 
            'Neu ca 4 thi sinh deu dung: Bam nut [Cong 10d ca 4 TS] (nut mau xanh ngoc) de cong nhanh 10 diem cho tat ca. Neu chi co mot so thi sinh dung: Bam nut [+10] tai cot cua thi sinh do.', 
            'Bam nut [Cong 10d ca 4 TS] hoac cac nut [+10] rieng.');

        this.addStep(5, 'Mo manh ghep hinh anh', 
            'Sau khi giai quyet xong hang ngang, bam nut [Mo manh ghep 1] (tuong ung H1, H2, H3, H4) de lat mo goc hinh anh chuong ngai vat.', 
            'Bam nut [Mo manh ghep] tuong ung.');

        this.addSubHeader('Thao tac xu ly khi co thi sinh bam chuong xin tra loi Dap an vong thi:');
        this.addParagraph('- Khi thi sinh bam chuong tren may cua minh, chuong reo to va tai khung thi sinh tren Controller se xuat hien dong chu do hien thi thoi gian bam chuong (vi du: TS1 da bam chuong tai giay thu 14.28S).\n' +
            '- Kiem tra thoi diem thi sinh bam chuong (truoc hay sau hang ngang nao).\n' +
            '- Cach cham diem: Bam nut [Cham DA vong thi (50-10d)]. Hop thoai xuat hien:\n' +
            '  + Nhap so thu tu thi sinh tra loi dung (1, 2, 3 hoac 4).\n' +
            '  + Nhap moc thoi diem tu 1 den 5 (1 la 50d, 2 la 40d, 3 la 30d, 4 la 20d, 5 la 10d).\n' +
            '  + Bam OK -> He thong tu dong cong diem tuong ung cho thi sinh do.\n' +
            '- Ngoai ra co the bam truc tiep cac nut [+50], [+40], [+30], [+20], [+10] ngay duoi ten thi sinh do tren ban dieu khien.\n' +
            '- Cuoi cung, bam nut [Mo tu khoa] de lat toan bo chu cai va mo hinh anh trung tam tren may chieu.');

        // Trang 5: Vong 4 (Vinh Quang), Cau hoi phu va Su co
        this.doc.addPage();
        this.addSectionHeader(6, 'Vong 4: Vinh Quang - Quy trinh goi cau hoi va ngoi sao hy vong', 'Ve dich');
        this.addParagraph('O vong Vinh Quang, moi thi sinh chon 3 cau hoi tu cac muc 10, 20, 30 diem. Thi sinh co quyen dat Ngoi sao hy vong cho 1 cau hoi.');

        this.addStep(1, 'Chon thi sinh thi dau va goi cau hoi', 
            'Bam chon the thi sinh (TS1, TS2, TS3 hoac TS4). Sau do tich chon 3 cau hoi theo lua chon cua thi sinh (vi du: cau 1 muc 20d, cau 2 muc 20d, cau 3 muc 30d).', 
            'Tich chon 3 o diem so tuong ung.');

        this.addStep(2, 'Dat Ngoi sao hy vong (neu thi sinh yeu cau)', 
            'Neu thi sinh yeu cau dat Ngoi sao hy vong truoc khi bat dau cau hoi, bam nut [Ngoi sao hy vong]. Bieu tuong ngoi sao vang se sang len tren may chieu va may thi sinh. Quy tac: Dung nhan gap doi so diem cau hoi, sai bi tru dung so diem cua cau do.', 
            'Bam nut [Ngoi sao hy vong] (nut mau vang).');

        this.addStep(3, 'Khoi dong thoi gian tra loi', 
            'Bam nut [Bat dau gio]. Thoi gian dem nguoc: 15 giay cho cau 10-20 diem; 20 hoac 30 giay cho cau 30 diem.', 
            'Bam nut [Bat dau gio].');

        this.addStep(4, 'Xu ly ket qua tra loi cua thi sinh chinh', 
            'Neu thi sinh tra loi DUNG: Bam nut [DUNG]. He thong tu dong cong diem (hoac nhan doi neu co Ngoi sao).\n' +
            'Neu thi sinh tra loi SAI: Bam nut [SAI] (neu co Ngoi sao se bi tru diem). Luc nay he thong tu dong phat am thanh mo chuong cuop diem cho 3 thi sinh con lai trong 5 giay.', 
            'Bam [DUNG] hoac [SAI].');

        this.addStep(5, 'Xu ly chuong cuop diem cua 3 thi sinh con lai', 
            'Neu co thi sinh bam chuong cuop diem: Ten thi sinh bam nhanh nhat se sang len. Neu nguoi do tra loi dung: Bam [DUNG CUOP DIEM] (duoc cong so diem goc cua cau hoi). Neu nguoi do tra loi sai: Bam [SAI CUOP DIEM] (bi tru 50% so diem cua cau hoi do).', 
            'Bam nut [DUNG CUOP DIEM] hoac [SAI CUOP DIEM].');

        this.addSectionHeader(7, 'Xu ly su co ky thuat va cac thao tac khan cap', 'Luu y dac biet');
        this.addParagraph('1. SUA DIEM TRUC TIEP KHI CO SAI SOT HOAC KHIEU NAI:\n' +
            '- Nhap dup chuot (Double click) vao o diem so cua bat ky thi sinh nao tren thanh trang thai thi sinh o dau Controller.\n' +
            '- Go so diem moi chinh xac va nhan Enter. Diem so se duoc cap nhat ngay lap tuc tren tat ca cac man hinh.\n\n' +
            '2. MAT KET NOI MOT HOAC NHIEU MAY THI SINH:\n' +
            '- Nhin vao thanh Reload Role o dau trang Controller, bam nut [TS1] (hoac TS2, TS3, TS4) de khoi dong lai ket noi cua may do.\n' +
            '- Neu may bi tat trinh duyet, cho thi sinh mo lai trinh duyet va quet lai ma QR tren man hinh Controller.\n\n' +
            '3. NGAT AM THANH KHAN CAP:\n' +
            '- Neu am thanh nhac nen hoac hieu ung bi lap lai, bam nut [Tat am thanh] / [Stop Sound] o goc tren ben phai de ngat toan bo am thanh ngay lap tuc.\n\n' +
            '4. VONG CAU HOI PHU (TIE-BREAKER):\n' +
            '- Chuyen sang tab [CAU HOI PHU]. Chon cac thi sinh co diem so bang nhau, bam [Mo chuong cau hoi phu]. Thi sinh nao bam chuong truoc se gianh quyen tra loi.');

        // Tong ket cuoi tai lieu
        this.doc.moveDown(1.5);
        this.doc.font(fontBold).fontSize(10).fillColor('#1e3a8a');
        this.doc.text('CHUC HOI THI DIEN RA THANH CONG TOT DEP!', { align: 'center' });
        this.doc.font(fontItalic).fontSize(8.5).fillColor('#64748b');
        this.doc.text('Ban Ky thuat He thong Duong Den Vinh Quang - Nam 2026', { align: 'center' });

        // Danh so trang toan bo tai lieu
        const pages = this.doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            this.doc.switchToPage(i);
            this.drawHeaderFooter(i + 1, pages.count);
        }

        this.doc.end();
    }
}

const generator = new PDFGuideGenerator();
generator.generate();

generator.writeStream.on('finish', () => {
    console.log(`Successfully generated PDF Guide at: ${outputPath}`);
});
