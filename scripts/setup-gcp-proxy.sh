#!/bin/bash
# scripts/setup-gcp-proxy.sh
# 구글 클라우드(GCP) 무료 리눅스(Ubuntu) 서버의 원격 터미널에서 실행하는 셋업 스크립트입니다.
# 한 줄의 명령어만 복사 붙여넣기 하면 Node.js 설치부터 중계 서버 24시간 가동까지 자동화합니다.

echo "=================================================="
echo " 🔍 GCP 법제처 API 중계 서버 자동 설치를 시작합니다."
echo "=================================================="

# 1. 우분투 패키지 업데이트 및 필수 패키지 설치
echo "🔄 [1/5] 리눅스 시스템 패키지를 업데이트하고 있습니다..."
sudo apt-get update -y
sudo apt-get install -y curl dirmngr apt-transport-https lsb-release ca-certificates

# 2. 최신 Node.js 20 LTS 버전 설치
echo "📥 [2/5] Node.js 엔진 설치를 실행하고 있습니다..."
curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Node.js 정상 설치 확인
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo "✅ Node.js 설치 확인: $NODE_VERSION"
echo "✅ npm 설치 확인: $NPM_VERSION"

# 3. 우분투 방화벽 8080 포트 개방
echo "🛡️ [3/5] 중계 통로(8080 포트) 방화벽을 개방하고 있습니다..."
sudo ufw allow 8080/tcp || true

# 4. 작업 폴더 생성 및 프록시 소스코드 다운로드
echo "📂 [4/5] 보상스쿨 중계 소스코드를 원격으로 다운로드하고 있습니다..."
mkdir -p ~/gcp-precedent-proxy
cd ~/gcp-precedent-proxy

# test-dynamic-search 브랜치에서 최신 proxy-server.js 코드를 가져옵니다.
curl -sSL -o proxy-server.js https://raw.githubusercontent.com/ksp-KWON/claimworks-blog/test-dynamic-search/scripts/proxy-server.js

# 5. PM2 (24시간 무중단 프로세스 관리자) 전역 설치 및 실행
echo "🚀 [5/5] 24시간 무중단 구동 시스템(PM2)을 구성하고 있습니다..."
sudo npm install -g pm2

# 기존 실행 중인 프록시가 있다면 정지 및 초기화
pm2 stop gcp-proxy || true
pm2 delete gcp-proxy || true

# 중계 서버 24시간 백그라운드 구동 시작
pm2 start proxy-server.js --name "gcp-proxy"

# 서버 재부팅 시에도 자동으로 복구 실행되도록 시작 프로그램 등록
pm2 save
sudo pm2 startup systemd -u $USER --hp $HOME || true

echo "=================================================="
echo " 🎉 설치 및 24시간 무중단 가동 세팅이 완료되었습니다!"
echo "=================================================="
echo "- 구동 포트: 8080"
echo "- 접속 토큰: secure_secret_token_12345"
echo "- 상태 확인 명령어: pm2 status"
echo "- 실시간 로그 보기: pm2 logs gcp-proxy"
echo "=================================================="

pm2 status
