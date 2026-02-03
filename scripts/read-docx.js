const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'P20250516KR_명세서_에듀이노랩_교육과정 생성 시스템 (2).docx');

mammoth.extractRawText({ path: filePath })
  .then(result => {
    console.log(result.value);
  })
  .catch(err => {
    console.error('Error:', err);
  });
