const fs = require('fs');
const path = require('path');

try {
    // 1. Update ai-comment.js
    const commentPath = path.join(__dirname, 'ai-comment.txt');
    const commentJsPath = path.join(__dirname, 'ai-comment.js');
    if (fs.existsSync(commentPath)) {
        const commentText = fs.readFileSync(commentPath, 'utf8');
        const commentJs = `const aiCommentData = \`${commentText.replace(/`/g, '\\`')}\`;`;
        fs.writeFileSync(commentJsPath, commentJs);
        console.log('✅ Updated ai-comment.js');
    }

    // 2. Update data.js
    const csvPath = path.join(__dirname, 'data.csv');
    const csvJsPath = path.join(__dirname, 'data.js');
    if (fs.existsSync(csvPath)) {
        const csvText = fs.readFileSync(csvPath, 'utf8');
        const csvJs = `const csvData = \`${csvText.replace(/`/g, '\\`')}\`;`;
        fs.writeFileSync(csvJsPath, csvJs);
        console.log('✅ Updated data.js');
    }

    // 3. Update industry_data.js
    const industryPath = path.join(__dirname, 'stock_industry_classification.csv');
    const industryJsPath = path.join(__dirname, 'industry_data.js');
    if (fs.existsSync(industryPath)) {
        const industryText = fs.readFileSync(industryPath, 'utf8');
        const industryJs = `const industryData = \`${industryText.replace(/`/g, '\\`')}\`;`;
        fs.writeFileSync(industryJsPath, industryJs);
        console.log('✅ Updated industry_data.js');
    }

    console.log('Hoàn tất! Bạn có thể F5 lại trình duyệt để xem dữ liệu mới.');
} catch (error) {
    console.error('❌ Có lỗi xảy ra:', error);
}
