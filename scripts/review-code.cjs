#!/usr/bin/env node
/**
 * Gemini Flash 코드 검수 스크립트
 * Education Builder Studio
 *
 * 사용법:
 *   node scripts/review-code.cjs              # git diff 변경사항 검수
 *   node scripts/review-code.cjs --file <파일경로>  # 특정 파일 검수
 *   node scripts/review-code.cjs --plan "<계획>"    # 계획/설계 검수
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 환경변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY가 .env.local에 없습니다');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// CLAUDE.md 규칙 로드
function loadProjectRules() {
  const claudeMdPath = path.join(__dirname, '..', 'CLAUDE.md');
  if (fs.existsSync(claudeMdPath)) {
    return fs.readFileSync(claudeMdPath, 'utf-8');
  }
  return '';
}

// git diff 가져오기
function getGitDiff() {
  try {
    const diff = execSync('git diff HEAD', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024
    });
    return diff || '변경사항 없음';
  } catch (e) {
    return '변경사항 없음';
  }
}

// 특정 파일 읽기
function readFile(filePath) {
  const fullPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ 파일을 찾을 수 없습니다: ${filePath}`);
    process.exit(1);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

// Gemini Flash로 검수
async function reviewWithGemini(content, type = 'code') {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const projectRules = loadProjectRules();

  const systemPrompt = `당신은 코드 검수 전문가입니다. Education Builder Studio 프로젝트의 QA 역할을 합니다.

## 프로젝트 규칙 (SSOT)
${projectRules}

## 검수 기준

### 1. 코드 품질
- Next.js/React 베스트 프랙티스 준수
- TypeScript 타입 안전성
- CSS가 JS에 인라인으로 들어가 있는지
- 중복 코드가 있는지
- 컴포넌트 분리가 적절한지

### 2. 프로젝트 규칙 준수
- CLAUDE.md에 명시된 규칙 위반 여부
- 파일/폴더 구조 규칙 준수

### 3. 버그 가능성
- null/undefined 체크 누락
- 비동기 처리 오류 가능성
- React hooks 규칙 위반
- 메모리 누수 가능성

### 4. 보안
- XSS 취약점
- API 키 노출
- 인증/인가 이슈

## 출력 형식
문제를 발견하면 다음 형식으로 출력:

🔴 심각: [문제 설명]
   위치: [파일:라인 또는 코드 위치]
   해결: [해결 방법]

🟡 주의: [문제 설명]
   위치: [파일:라인 또는 코드 위치]
   해결: [해결 방법]

🟢 개선: [개선 제안]
   위치: [파일:라인 또는 코드 위치]
   제안: [개선 방법]

문제가 없으면 "✅ 검수 통과 - 문제 없음"이라고 출력.
`;

  let userPrompt;
  if (type === 'code') {
    userPrompt = `다음 코드 변경사항을 검수해주세요:\n\n${content}`;
  } else if (type === 'file') {
    userPrompt = `다음 파일 전체를 검수해주세요:\n\n${content}`;
  } else if (type === 'plan') {
    userPrompt = `다음 구현 계획을 검수해주세요. 프로젝트 규칙과 맞는지, 잠재적 문제가 있는지 확인:\n\n${content}`;
  }

  try {
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt }
    ]);
    return result.response.text();
  } catch (error) {
    console.error('❌ Gemini API 오류:', error.message);
    process.exit(1);
  }
}

// 메인 실행
async function main() {
  const args = process.argv.slice(2);

  console.log('🔍 Gemini Flash 코드 검수 시작...\n');

  let content, type;

  if (args.includes('--file')) {
    const fileIndex = args.indexOf('--file') + 1;
    const filePath = args[fileIndex];
    if (!filePath) {
      console.error('❌ 파일 경로를 지정해주세요');
      process.exit(1);
    }
    console.log(`📄 파일 검수: ${filePath}\n`);
    content = `// 파일: ${filePath}\n\n${readFile(filePath)}`;
    type = 'file';
  } else if (args.includes('--plan')) {
    const planIndex = args.indexOf('--plan') + 1;
    const plan = args[planIndex];
    if (!plan) {
      console.error('❌ 계획 내용을 지정해주세요');
      process.exit(1);
    }
    console.log(`📋 계획 검수\n`);
    content = plan;
    type = 'plan';
  } else {
    console.log(`📝 Git diff 변경사항 검수\n`);
    content = getGitDiff();
    type = 'code';

    if (content === '변경사항 없음') {
      console.log('ℹ️  변경사항이 없습니다.');
      return;
    }
  }

  if (content.length > 100000) {
    console.log('⚠️  내용이 너무 깁니다. 처음 100,000자만 검수합니다.\n');
    content = content.substring(0, 100000);
  }

  const result = await reviewWithGemini(content, type);

  console.log('━'.repeat(50));
  console.log('📋 검수 결과');
  console.log('━'.repeat(50));
  console.log(result);
  console.log('━'.repeat(50));
}

main().catch(console.error);
