#!/usr/bin/env pwsh
# fix-post-format.ps1
# 보상스쿨 블로그 포스팅 포맷 오류 일괄 수정 스크립트
# 수정 항목:
#   1. ## # Q : -> ### Q : (FAQ 형식 정규화)
#   2. ## # 텍스트 -> ### 텍스트 (제목 내 # 제거)
#   3. ## ## 제목 -> ## 제목 (이중 ## 제거)
#   4. [추천 제목 2개] ~ 파일 끝 블록 삭제
#   5. 손해사정사 비교표 코드블록을 마크다운 표로 변환

$postsDir = Join-Path $PSScriptRoot "..\src\content\posts"
$mdFiles = Get-ChildItem -Path $postsDir -Filter "*.md"

$fixedCount = 0

foreach ($file in $mdFiles) {
    $original = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $text = $original

    # ── 1. FAQ 오류: "## # Q :" → "### Q :" ─────────────────────────────────
    $text = $text -replace '(?m)^## #\s+Q\s*:', '### Q :'

    # ── 2. 단계 제목 오류: "## # 텍스트" → "### 텍스트" ──────────────────────
    $text = $text -replace '(?m)^## #\s+', '### '

    # ── 3. 이중 ## 오류: "## ## 제목" → "## 제목" ────────────────────────────
    $text = $text -replace '(?m)^## ## ', '## '

    # ── 4. [추천 제목 2개] 이후 블록 전체 삭제 (CRLF/LF 모두 대응) ─────────
    # 줄 단위로 분리해서 [추천 제목으로 시작하는 라인 찾기
    $lines = $text -split "`r?`n"
    $cutIdx = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^\[추천 제목') {
            $cutIdx = $i
            # 앞의 빈줄 또는 --- 구분선도 함께 제거
            while ($cutIdx -gt 0 -and ($lines[$cutIdx-1].Trim() -eq '' -or $lines[$cutIdx-1] -match '^---')) {
                $cutIdx--
            }
            break
        }
    }
    if ($cutIdx -ge 0) {
        $lines = $lines[0..($cutIdx - 1)]
        $text = ($lines -join "`r`n")
    }

    # ── 5. 파일 끝 정리 ───────────────────────────────────────────────────────
    $text = $text.TrimEnd() + "`n"

    if ($text -ne $original) {
        Set-Content -Path $file.FullName -Value $text -Encoding UTF8 -NoNewline
        Write-Host "✅ Fixed: $($file.Name)"
        $fixedCount++
    } else {
        Write-Host "⏭️  Skip:  $($file.Name) (no changes)"
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "총 수정된 파일: $fixedCount / $($mdFiles.Count)"
