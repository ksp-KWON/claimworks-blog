/**
 * jurisdiction-data.ts
 * 대한민국 17개 광역시도, 250개 시·군·구 관할 법원 및 검찰청 공식 데이터셋
 * 
 * [법적 근거 SSOT]
 * - 법률: 「각급 법원의 설치와 관할구역에 관한 법률」(법률 제19943호)
 * - 조항: 제4조 및 [별표 3] "고등법원·지방법원과 그 지원의 관할구역"
 * - 검찰청: 「검찰청법」 제3조 (각급 검찰청의 설치와 관할구역)
 */

export interface JurisdictionInfo {
  court: string;        // 관할 지방법원 (본원 또는 지원)
  prosecution: string;  // 관할 지방검찰청 (지검 또는 지청)
  highCourt: string;    // 관할 고등법원
  courtType: '본원' | '지원';
  notes?: string;       // 실무상 특이사항 (예: 회생·파산, 항소 관할 등)
}

export const JURISDICTION_MAP: Record<string, Record<string, JurisdictionInfo>> = {
  '서울특별시': {
    '강남구': { court: '서울중앙지방법원', prosecution: '서울중앙지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '서초구': { court: '서울중앙지방법원', prosecution: '서울중앙지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '종로구': { court: '서울중앙지방법원', prosecution: '서울중앙지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '중구': { court: '서울중앙지방법원', prosecution: '서울중앙지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '관악구': { court: '서울중앙지방법원', prosecution: '서울중앙지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '동작구': { court: '서울중앙지방법원', prosecution: '서울중앙지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '성동구': { court: '서울동부지방법원', prosecution: '서울동부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '광진구': { court: '서울동부지방법원', prosecution: '서울동부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '강동구': { court: '서울동부지방법원', prosecution: '서울동부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '송파구': { court: '서울동부지방법원', prosecution: '서울동부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '영등포구': { court: '서울남부지방법원', prosecution: '서울남부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '양천구': { court: '서울남부지방법원', prosecution: '서울남부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '강서구': { court: '서울남부지방법원', prosecution: '서울남부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '구로구': { court: '서울남부지방법원', prosecution: '서울남부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '금천구': { court: '서울남부지방법원', prosecution: '서울남부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '동대문구': { court: '서울북부지방법원', prosecution: '서울북부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '중랑구': { court: '서울북부지방법원', prosecution: '서울북부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '성북구': { court: '서울북부지방법원', prosecution: '서울북부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '도봉구': { court: '서울북부지방법원', prosecution: '서울북부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '강북구': { court: '서울북부지방법원', prosecution: '서울북부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '노원구': { court: '서울북부지방법원', prosecution: '서울북부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '서대문구': { court: '서울서부지방법원', prosecution: '서울서부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '마포구': { court: '서울서부지방법원', prosecution: '서울서부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '은평구': { court: '서울서부지방법원', prosecution: '서울서부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '용산구': { court: '서울서부지방법원', prosecution: '서울서부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
  },
  '경기도': {
    '수원시': { court: '수원지방법원', prosecution: '수원지방검찰청', highCourt: '수원고등법원', courtType: '본원' },
    '화성시': { court: '수원지방법원', prosecution: '수원지방검찰청', highCourt: '수원고등법원', courtType: '본원' },
    '오산시': { court: '수원지방법원', prosecution: '수원지방검찰청', highCourt: '수원고등법원', courtType: '본원' },
    '용인시': { court: '수원지방법원', prosecution: '수원지방검찰청', highCourt: '수원고등법원', courtType: '본원' },
    '성남시': { court: '수원지방법원 성남지원', prosecution: '수원지방검찰청 성남지청', highCourt: '수원고등법원', courtType: '지원' },
    '하남시': { court: '수원지방법원 성남지원', prosecution: '수원지방검찰청 성남지청', highCourt: '수원고등법원', courtType: '지원' },
    '광주시': { court: '수원지방법원 성남지원', prosecution: '수원지방검찰청 성남지청', highCourt: '수원고등법원', courtType: '지원' },
    '평택시': { court: '수원지방법원 평택지원', prosecution: '수원지방검찰청 평택지청', highCourt: '수원고등법원', courtType: '지원' },
    '안성시': { court: '수원지방법원 평택지원', prosecution: '수원지방검찰청 평택지청', highCourt: '수원고등법원', courtType: '지원' },
    '안산시': { court: '수원지방법원 안산지원', prosecution: '수원지방검찰청 안산지청', highCourt: '수원고등법원', courtType: '지원' },
    '광명시': { court: '수원지방법원 안산지원', prosecution: '수원지방검찰청 안산지청', highCourt: '수원고등법원', courtType: '지원' },
    '시흥시': { court: '수원지방법원 안산지원', prosecution: '수원지방검찰청 안산지청', highCourt: '수원고등법원', courtType: '지원' },
    '안양시': { court: '수원지방법원 안양지원', prosecution: '수원지방검찰청 안양지청', highCourt: '수원고등법원', courtType: '지원' },
    '과천시': { court: '수원지방법원 안양지원', prosecution: '수원지방검찰청 안양지청', highCourt: '수원고등법원', courtType: '지원' },
    '의왕시': { court: '수원지방법원 안양지원', prosecution: '수원지방검찰청 안양지청', highCourt: '수원고등법원', courtType: '지원' },
    '군포시': { court: '수원지방법원 안양지원', prosecution: '수원지방검찰청 안양지청', highCourt: '수원고등법원', courtType: '지원' },
    '여주시': { court: '수원지방법원 여주지원', prosecution: '수원지방검찰청 여주지청', highCourt: '수원고등법원', courtType: '지원' },
    '이천시': { court: '수원지방법원 여주지원', prosecution: '수원지방검찰청 여주지청', highCourt: '수원고등법원', courtType: '지원' },
    '양평군': { court: '수원지방법원 여주지원', prosecution: '수원지방검찰청 여주지청', highCourt: '수원고등법원', courtType: '지원' },
    '부천시': { court: '인천지방법원 부천지원', prosecution: '인천지방검찰청 부천지청', highCourt: '서울고등법원', courtType: '지원' },
    '김포시': { court: '인천지방법원 부천지원', prosecution: '인천지방검찰청 부천지청', highCourt: '서울고등법원', courtType: '지원' },
    '고양시': { court: '의정부지방법원 고양지원', prosecution: '의정부지방검찰청 고양지청', highCourt: '서울고등법원', courtType: '지원' },
    '파주시': { court: '의정부지방법원 고양지원', prosecution: '의정부지방검찰청 고양지청', highCourt: '서울고등법원', courtType: '지원' },
    '남양주시': { court: '의정부지방법원 남양주지원', prosecution: '의정부지방검찰청 남양주지청', highCourt: '서울고등법원', courtType: '지원' },
    '구리시': { court: '의정부지방법원 남양주지원', prosecution: '의정부지방검찰청 남양주지청', highCourt: '서울고등법원', courtType: '지원' },
    '가평군': { court: '의정부지방법원 남양주지원', prosecution: '의정부지방검찰청 남양주지청', highCourt: '서울고등법원', courtType: '지원' },
    '의정부시': { court: '의정부지방법원', prosecution: '의정부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '양주시': { court: '의정부지방법원', prosecution: '의정부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '동두천시': { court: '의정부지방법원', prosecution: '의정부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '포천시': { court: '의정부지방법원', prosecution: '의정부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '연천군': { court: '의정부지방법원', prosecution: '의정부지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
  },
  '인천광역시': {
    '미추홀구': { court: '인천지방법원', prosecution: '인천지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '중구': { court: '인천지방법원', prosecution: '인천지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '동구': { court: '인천지방법원', prosecution: '인천지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '남동구': { court: '인천지방법원', prosecution: '인천지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '연수구': { court: '인천지방법원', prosecution: '인천지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '부평구': { court: '인천지방법원', prosecution: '인천지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '계양구': { court: '인천지방법원', prosecution: '인천지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '서구': { court: '인천지방법원', prosecution: '인천지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '강화군': { court: '인천지방법원', prosecution: '인천지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
    '옹진군': { court: '인천지방법원', prosecution: '인천지방검찰청', highCourt: '서울고등법원', courtType: '본원' },
  },
  '부산광역시': {
    '해운대구': { court: '부산지방법원 동부지원', prosecution: '부산지방검찰청 동부지청', highCourt: '부산고등법원', courtType: '지원' },
    '수영구': { court: '부산지방법원 동부지원', prosecution: '부산지방검찰청 동부지청', highCourt: '부산고등법원', courtType: '지원' },
    '기장군': { court: '부산지방법원 동부지원', prosecution: '부산지방검찰청 동부지청', highCourt: '부산고등법원', courtType: '지원' },
    '강서구': { court: '부산지방법원 서부지원', prosecution: '부산지방검찰청 서부지청', highCourt: '부산고등법원', courtType: '지원' },
    '사하구': { court: '부산지방법원 서부지원', prosecution: '부산지방검찰청 서부지청', highCourt: '부산고등법원', courtType: '지원' },
    '사상구': { court: '부산지방법원 서부지원', prosecution: '부산지방검찰청 서부지청', highCourt: '부산고등법원', courtType: '지원' },
    '북구': { court: '부산지방법원 서부지원', prosecution: '부산지방검찰청 서부지청', highCourt: '부산고등법원', courtType: '지원' },
    '연제구': { court: '부산지방법원', prosecution: '부산지방검찰청', highCourt: '부산고등법원', courtType: '본원' },
    '부산진구': { court: '부산지방법원', prosecution: '부산지방검찰청', highCourt: '부산고등법원', courtType: '본원' },
    '동래구': { court: '부산지방법원', prosecution: '부산지방검찰청', highCourt: '부산고등법원', courtType: '본원' },
    '남구': { court: '부산지방법원 동부지원', prosecution: '부산지방검찰청 동부지청', highCourt: '부산고등법원', courtType: '지원' },
    '금정구': { court: '부산지방법원', prosecution: '부산지방검찰청', highCourt: '부산고등법원', courtType: '본원' },
    '중구': { court: '부산지방법원', prosecution: '부산지방검찰청', highCourt: '부산고등법원', courtType: '본원' },
    '서구': { court: '부산지방법원 서부지원', prosecution: '부산지방검찰청 서부지청', highCourt: '부산고등법원', courtType: '지원' },
    '동구': { court: '부산지방법원', prosecution: '부산지방검찰청', highCourt: '부산고등법원', courtType: '본원' },
    '영도구': { court: '부산지방법원', prosecution: '부산지방검찰청', highCourt: '부산고등법원', courtType: '본원' },
  },
  '대구광역시': {
    '중구': { court: '대구지방법원', prosecution: '대구지방검찰청', highCourt: '대구고등법원', courtType: '본원' },
    '동구': { court: '대구지방법원', prosecution: '대구지방검찰청', highCourt: '대구고등법원', courtType: '본원' },
    '남구': { court: '대구지방법원', prosecution: '대구지방검찰청', highCourt: '대구고등법원', courtType: '본원' },
    '북구': { court: '대구지방법원', prosecution: '대구지방검찰청', highCourt: '대구고등법원', courtType: '본원' },
    '수성구': { court: '대구지방법원', prosecution: '대구지방검찰청', highCourt: '대구고등법원', courtType: '본원' },
    '서구': { court: '대구지방법원 서부지원', prosecution: '대구지방검찰청 서부지청', highCourt: '대구고등법원', courtType: '지원' },
    '달서구': { court: '대구지방법원 서부지원', prosecution: '대구지방검찰청 서부지청', highCourt: '대구고등법원', courtType: '지원' },
    '달성군': { court: '대구지방법원 서부지원', prosecution: '대구지방검찰청 서부지청', highCourt: '대구고등법원', courtType: '지원' },
    '군위군': { court: '대구지방법원 의성지원', prosecution: '대구지방검찰청 의성지청', highCourt: '대구고등법원', courtType: '지원' },
  },
  '광주광역시': {
    '동구': { court: '광주지방법원', prosecution: '광주지방검찰청', highCourt: '광주고등법원', courtType: '본원' },
    '서구': { court: '광주지방법원', prosecution: '광주지방검찰청', highCourt: '광주고등법원', courtType: '본원' },
    '남구': { court: '광주지방법원', prosecution: '광주지방검찰청', highCourt: '광주고등법원', courtType: '본원' },
    '북구': { court: '광주지방법원', prosecution: '광주지방검찰청', highCourt: '광주고등법원', courtType: '본원' },
    '광산구': { court: '광주지방법원', prosecution: '광주지방검찰청', highCourt: '광주고등법원', courtType: '본원' },
  },
  '대전광역시': {
    '동구': { court: '대전지방법원', prosecution: '대전지방검찰청', highCourt: '대전고등법원', courtType: '본원' },
    '중구': { court: '대전지방법원', prosecution: '대전지방검찰청', highCourt: '대전고등법원', courtType: '본원' },
    '서구': { court: '대전지방법원', prosecution: '대전지방검찰청', highCourt: '대전고등법원', courtType: '본원' },
    '유성구': { court: '대전지방법원', prosecution: '대전지방검찰청', highCourt: '대전고등법원', courtType: '본원' },
    '대덕구': { court: '대전지방법원', prosecution: '대전지방검찰청', highCourt: '대전고등법원', courtType: '본원' },
  },
  '울산광역시': {
    '남구': { court: '울산지방법원', prosecution: '울산지방검찰청', highCourt: '부산고등법원', courtType: '본원' },
    '중구': { court: '울산지방법원', prosecution: '울산지방검찰청', highCourt: '부산고등법원', courtType: '본원' },
    '동구': { court: '울산지방법원', prosecution: '울산지방검찰청', highCourt: '부산고등법원', courtType: '본원' },
    '북구': { court: '울산지방법원', prosecution: '울산지방검찰청', highCourt: '부산고등법원', courtType: '본원' },
    '울주군': { court: '울산지방법원', prosecution: '울산지방검찰청', highCourt: '부산고등법원', courtType: '본원' },
  },
  '세종특별자치시': {
    '세종시': { court: '대전지방법원', prosecution: '대전지방검찰청', highCourt: '대전고등법원', courtType: '본원' },
  },
  '강원특별자치도': {
    '춘천시': { court: '춘천지방법원', prosecution: '춘천지방검찰청', highCourt: '서울고등법원(춘천)', courtType: '본원' },
    '홍천군': { court: '춘천지방법원', prosecution: '춘천지방검찰청', highCourt: '서울고등법원(춘천)', courtType: '본원' },
    '화천군': { court: '춘천지방법원', prosecution: '춘천지방검찰청', highCourt: '서울고등법원(춘천)', courtType: '본원' },
    '양구군': { court: '춘천지방법원', prosecution: '춘천지방검찰청', highCourt: '서울고등법원(춘천)', courtType: '본원' },
    '인제군': { court: '춘천지방법원', prosecution: '춘천지방검찰청', highCourt: '서울고등법원(춘천)', courtType: '본원' },
    '강릉시': { court: '춘천지방법원 강릉지원', prosecution: '춘천지방검찰청 강릉지청', highCourt: '서울고등법원(춘천)', courtType: '지원' },
    '동해시': { court: '춘천지방법원 강릉지원', prosecution: '춘천지방검찰청 강릉지청', highCourt: '서울고등법원(춘천)', courtType: '지원' },
    '삼척시': { court: '춘천지방법원 강릉지원', prosecution: '춘천지방검찰청 강릉지청', highCourt: '서울고등법원(춘천)', courtType: '지원' },
    '원주시': { court: '춘천지방법원 원주지원', prosecution: '춘천지방검찰청 원주지청', highCourt: '서울고등법원(춘천)', courtType: '지원' },
    '횡성군': { court: '춘천지방법원 원주지원', prosecution: '춘천지방검찰청 원주지청', highCourt: '서울고등법원(춘천)', courtType: '지원' },
    '속초시': { court: '춘천지방법원 속초지원', prosecution: '춘천지방검찰청 속초지청', highCourt: '서울고등법원(춘천)', courtType: '지원' },
    '양양군': { court: '춘천지방법원 속초지원', prosecution: '춘천지방검찰청 속초지청', highCourt: '서울고등법원(춘천)', courtType: '지원' },
    '고성군': { court: '춘천지방법원 속초지원', prosecution: '춘천지방검찰청 속초지청', highCourt: '서울고등법원(춘천)', courtType: '지원' },
    '영월군': { court: '춘천지방법원 영월지원', prosecution: '춘천지방검찰청 영월지청', highCourt: '서울고등법원(춘천)', courtType: '지원' },
    '태백시': { court: '춘천지방법원 영월지원', prosecution: '춘천지방검찰청 영월지청', highCourt: '서울고등법원(춘천)', courtType: '지원' },
    '정선군': { court: '춘천지방법원 영월지원', prosecution: '춘천지방검찰청 영월지청', highCourt: '서울고등법원(춘천)', courtType: '지원' },
    '평창군': { court: '춘천지방법원 영월지원', prosecution: '춘천지방검찰청 영월지청', highCourt: '서울고등법원(춘천)', courtType: '지원' },
    '철원군': { court: '의정부지방법원', prosecution: '의정부지방검찰청', highCourt: '서울고등법원', courtType: '본원', notes: '행정구역은 강원이나 사법관할은 의정부지법' },
  },
  '충청북도': {
    '청주시': { court: '청주지방법원', prosecution: '청주지방검찰청', highCourt: '대전고등법원(청주)', courtType: '본원' },
    '진천군': { court: '청주지방법원', prosecution: '청주지방검찰청', highCourt: '대전고등법원(청주)', courtType: '본원' },
    '보은군': { court: '청주지방법원', prosecution: '청주지방검찰청', highCourt: '대전고등법원(청주)', courtType: '본원' },
    '괴산군': { court: '청주지방법원', prosecution: '청주지방검찰청', highCourt: '대전고등법원(청주)', courtType: '본원' },
    '증평군': { court: '청주지방법원', prosecution: '청주지방검찰청', highCourt: '대전고등법원(청주)', courtType: '본원' },
    '충주시': { court: '청주지방법원 충주지원', prosecution: '청주지방검찰청 충주지청', highCourt: '대전고등법원(청주)', courtType: '지원' },
    '음성군': { court: '청주지방법원 충주지원', prosecution: '청주지방검찰청 충주지청', highCourt: '대전고등법원(청주)', courtType: '지원' },
    '제천시': { court: '청주지방법원 제천지원', prosecution: '청주지방검찰청 제천지청', highCourt: '대전고등법원(청주)', courtType: '지원' },
    '단양군': { court: '청주지방법원 제천지원', prosecution: '청주지방검찰청 제천지청', highCourt: '대전고등법원(청주)', courtType: '지원' },
    '영동군': { court: '청주지방법원 영동지원', prosecution: '청주지방검찰청 영동지청', highCourt: '대전고등법원(청주)', courtType: '지원' },
    '옥천군': { court: '청주지방법원 영동지원', prosecution: '청주지방검찰청 영동지청', highCourt: '대전고등법원(청주)', courtType: '지원' },
  },
  '충청남도': {
    '천안시': { court: '대전지방법원 천안지원', prosecution: '대전지방검찰청 천안지청', highCourt: '대전고등법원', courtType: '지원' },
    '아산시': { court: '대전지방법원 천안지원', prosecution: '대전지방검찰청 천안지청', highCourt: '대전고등법원', courtType: '지원' },
    '서산시': { court: '대전지방법원 서산지원', prosecution: '대전지방검찰청 서산지청', highCourt: '대전고등법원', courtType: '지원' },
    '당진시': { court: '대전지방법원 서산지원', prosecution: '대전지방검찰청 서산지청', highCourt: '대전고등법원', courtType: '지원' },
    '태안군': { court: '대전지방법원 서산지원', prosecution: '대전지방검찰청 서산지청', highCourt: '대전고등법원', courtType: '지원' },
    '공주시': { court: '대전지방법원 공주지원', prosecution: '대전지방검찰청 공주지청', highCourt: '대전고등법원', courtType: '지원' },
    '청양군': { court: '대전지방법원 공주지원', prosecution: '대전지방검찰청 공주지청', highCourt: '대전고등법원', courtType: '지원' },
    '논산시': { court: '대전지방법원 논산지원', prosecution: '대전지방검찰청 논산지청', highCourt: '대전고등법원', courtType: '지원' },
    '계룡시': { court: '대전지방법원 논산지원', prosecution: '대전지방검찰청 논산지청', highCourt: '대전고등법원', courtType: '지원' },
    '부여군': { court: '대전지방법원 논산지원', prosecution: '대전지방검찰청 논산지청', highCourt: '대전고등법원', courtType: '지원' },
    '홍성군': { court: '대전지방법원 홍성지원', prosecution: '대전지방검찰청 홍성지청', highCourt: '대전고등법원', courtType: '지원' },
    '보령시': { court: '대전지방법원 홍성지원', prosecution: '대전지방검찰청 홍성지청', highCourt: '대전고등법원', courtType: '지원' },
    '서천군': { court: '대전지방법원 홍성지원', prosecution: '대전지방검찰청 홍성지청', highCourt: '대전고등법원', courtType: '지원' },
    '예산군': { court: '대전지방법원 홍성지원', prosecution: '대전지방검찰청 홍성지청', highCourt: '대전고등법원', courtType: '지원' },
    '금산군': { court: '대전지방법원', prosecution: '대전지방검찰청', highCourt: '대전고등법원', courtType: '본원' },
  },
  '전북특별자치도': {
    '전주시': { court: '전주지방법원', prosecution: '전주지방검찰청', highCourt: '광주고등법원(전주)', courtType: '본원' },
    '완주군': { court: '전주지방법원', prosecution: '전주지방검찰청', highCourt: '광주고등법원(전주)', courtType: '본원' },
    '김제시': { court: '전주지방법원', prosecution: '전주지방검찰청', highCourt: '광주고등법원(전주)', courtType: '본원' },
    '임실군': { court: '전주지방법원', prosecution: '전주지방검찰청', highCourt: '광주고등법원(전주)', courtType: '본원' },
    '진안군': { court: '전주지방법원', prosecution: '전주지방검찰청', highCourt: '광주고등법원(전주)', courtType: '본원' },
    '무주군': { court: '전주지방법원', prosecution: '전주지방검찰청', highCourt: '광주고등법원(전주)', courtType: '본원' },
    '군산시': { court: '전주지방법원 군산지원', prosecution: '전주지방검찰청 군산지청', highCourt: '광주고등법원(전주)', courtType: '지원' },
    '익산시': { court: '전주지방법원 군산지원', prosecution: '전주지방검찰청 군산지청', highCourt: '광주고등법원(전주)', courtType: '지원' },
    '정읍시': { court: '전주지방법원 정읍지원', prosecution: '전주지방검찰청 정읍지청', highCourt: '광주고등법원(전주)', courtType: '지원' },
    '부안군': { court: '전주지방법원 정읍지원', prosecution: '전주지방검찰청 정읍지청', highCourt: '광주고등법원(전주)', courtType: '지원' },
    '고창군': { court: '전주지방법원 정읍지원', prosecution: '전주지방검찰청 정읍지청', highCourt: '광주고등법원(전주)', courtType: '지원' },
    '남원시': { court: '전주지방법원 남원지원', prosecution: '전주지방검찰청 남원지청', highCourt: '광주고등법원(전주)', courtType: '지원' },
    '순창군': { court: '전주지방법원 남원지원', prosecution: '전주지방검찰청 남원지청', highCourt: '광주고등법원(전주)', courtType: '지원' },
    '장수군': { court: '전주지방법원 남원지원', prosecution: '전주지방검찰청 남원지청', highCourt: '광주고등법원(전주)', courtType: '지원' },
  },
  '전라남도': {
    '목포시': { court: '광주지방법원 목포지원', prosecution: '광주지방검찰청 목포지청', highCourt: '광주고등법원', courtType: '지원' },
    '무안군': { court: '광주지방법원 목포지원', prosecution: '광주지방검찰청 목포지청', highCourt: '광주고등법원', courtType: '지원' },
    '신안군': { court: '광주지방법원 목포지원', prosecution: '광주지방검찰청 목포지청', highCourt: '광주고등법원', courtType: '지원' },
    '함평군': { court: '광주지방법원 목포지원', prosecution: '광주지방검찰청 목포지청', highCourt: '광주고등법원', courtType: '지원' },
    '영암군': { court: '광주지방법원 목포지원', prosecution: '광주지방검찰청 목포지청', highCourt: '광주고등법원', courtType: '지원' },
    '순천시': { court: '광주지방법원 순천지원', prosecution: '광주지방검찰청 순천지청', highCourt: '광주고등법원', courtType: '지원' },
    '여수시': { court: '광주지방법원 순천지원', prosecution: '광주지방검찰청 순천지청', highCourt: '광주고등법원', courtType: '지원' },
    '광양시': { court: '광주지방법원 순천지원', prosecution: '광주지방검찰청 순천지청', highCourt: '광주고등법원', courtType: '지원' },
    '구례군': { court: '광주지방법원 순천지원', prosecution: '광주지방검찰청 순천지청', highCourt: '광주고등법원', courtType: '지원' },
    '고흥군': { court: '광주지방법원 순천지원', prosecution: '광주지방검찰청 순천지청', highCourt: '광주고등법원', courtType: '지원' },
    '보성군': { court: '광주지방법원 순천지원', prosecution: '광주지방검찰청 순천지청', highCourt: '광주고등법원', courtType: '지원' },
    '해남군': { court: '광주지방법원 해남지원', prosecution: '광주지방검찰청 해남지청', highCourt: '광주고등법원', courtType: '지원' },
    '완도군': { court: '광주지방법원 해남지원', prosecution: '광주지방검찰청 해남지청', highCourt: '광주고등법원', courtType: '지원' },
    '진도군': { court: '광주지방법원 해남지원', prosecution: '광주지방검찰청 해남지청', highCourt: '광주고등법원', courtType: '지원' },
    '강진군': { court: '광주지방법원 장흥지원', prosecution: '광주지방검찰청 장흥지청', highCourt: '광주고등법원', courtType: '지원' },
    '장흥군': { court: '광주지방법원 장흥지원', prosecution: '광주지방검찰청 장흥지청', highCourt: '광주고등법원', courtType: '지원' },
    '나주시': { court: '광주지방법원', prosecution: '광주지방검찰청', highCourt: '광주고등법원', courtType: '본원' },
    '화순군': { court: '광주지방법원', prosecution: '광주지방검찰청', highCourt: '광주고등법원', courtType: '본원' },
    '담양군': { court: '광주지방법원', prosecution: '광주지방검찰청', highCourt: '광주고등법원', courtType: '본원' },
    '장성군': { court: '광주지방법원', prosecution: '광주지방검찰청', highCourt: '광주고등법원', courtType: '본원' },
    '곡성군': { court: '광주지방법원', prosecution: '광주지방검찰청', highCourt: '광주고등법원', courtType: '본원' },
    '영광군': { court: '광주지방법원', prosecution: '광주지방검찰청', highCourt: '광주고등법원', courtType: '본원' },
  },
  '경상북도': {
    '포항시': { court: '대구지방법원 포항지원', prosecution: '대구지방검찰청 포항지청', highCourt: '대구고등법원', courtType: '지원' },
    '울릉군': { court: '대구지방법원 포항지원', prosecution: '대구지방검찰청 포항지청', highCourt: '대구고등법원', courtType: '지원' },
    '경주시': { court: '대구지방법원 경주지원', prosecution: '대구지방검찰청 경주지청', highCourt: '대구고등법원', courtType: '지원' },
    '김천시': { court: '대구지방법원 김천지원', prosecution: '대구지방검찰청 김천지청', highCourt: '대구고등법원', courtType: '지원' },
    '구미시': { court: '대구지방법원 김천지원', prosecution: '대구지방검찰청 김천지청', highCourt: '대구고등법원', courtType: '지원' },
    '칠곡군': { court: '대구지방법원 김천지원', prosecution: '대구지방검찰청 김천지청', highCourt: '대구고등법원', courtType: '지원' },
    '안동시': { court: '대구지방법원 안동지원', prosecution: '대구지방검찰청 안동지청', highCourt: '대구고등법원', courtType: '지원' },
    '영주시': { court: '대구지방법원 안동지원', prosecution: '대구지방검찰청 안동지청', highCourt: '대구고등법원', courtType: '지원' },
    '봉화군': { court: '대구지방법원 안동지원', prosecution: '대구지방검찰청 안동지청', highCourt: '대구고등법원', courtType: '지원' },
    '상주시': { court: '대구지방법원 상주지원', prosecution: '대구지방검찰청 상주지청', highCourt: '대구고등법원', courtType: '지원' },
    '문경시': { court: '대구지방법원 상주지원', prosecution: '대구지방검찰청 상주지청', highCourt: '대구고등법원', courtType: '지원' },
    '예천군': { court: '대구지방법원 상주지원', prosecution: '대구지방검찰청 상주지청', highCourt: '대구고등법원', courtType: '지원' },
    '의성군': { court: '대구지방법원 의성지원', prosecution: '대구지방검찰청 의성지청', highCourt: '대구고등법원', courtType: '지원' },
    '청송군': { court: '대구지방법원 의성지원', prosecution: '대구지방검찰청 의성지청', highCourt: '대구고등법원', courtType: '지원' },
    '영덕군': { court: '대구지방법원 영덕지원', prosecution: '대구지방검찰청 영덕지청', highCourt: '대구고등법원', courtType: '지원' },
    '울진군': { court: '대구지방법원 영덕지원', prosecution: '대구지방검찰청 영덕지청', highCourt: '대구고등법원', courtType: '지원' },
    '영양군': { court: '대구지방법원 영덕지원', prosecution: '대구지방검찰청 영덕지청', highCourt: '대구고등법원', courtType: '지원' },
    '경산시': { court: '대구지방법원', prosecution: '대구지방검찰청', highCourt: '대구고등법원', courtType: '본원' },
    '청도군': { court: '대구지방법원', prosecution: '대구지방검찰청', highCourt: '대구고등법원', courtType: '본원' },
    '영천시': { court: '대구지방법원', prosecution: '대구지방검찰청', highCourt: '대구고등법원', courtType: '본원' },
    '고령군': { court: '대구지방법원 서부지원', prosecution: '대구지방검찰청 서부지청', highCourt: '대구고등법원', courtType: '지원' },
    '성주군': { court: '대구지방법원 서부지원', prosecution: '대구지방검찰청 서부지청', highCourt: '대구고등법원', courtType: '지원' },
  },
  '경상남도': {
    '창원시': { court: '창원지방법원', prosecution: '창원지방검찰청', highCourt: '부산고등법원(창원)', courtType: '본원' },
    '김해시': { court: '창원지방법원', prosecution: '창원지방검찰청', highCourt: '부산고등법원(창원)', courtType: '본원' },
    '함안군': { court: '창원지방법원', prosecution: '창원지방검찰청', highCourt: '부산고등법원(창원)', courtType: '본원' },
    '의령군': { court: '창원지방법원', prosecution: '창원지방검찰청', highCourt: '부산고등법원(창원)', courtType: '본원' },
    '진주시': { court: '창원지방법원 진주지원', prosecution: '창원지방검찰청 진주지청', highCourt: '부산고등법원(창원)', courtType: '지원' },
    '사천시': { court: '창원지방법원 진주지원', prosecution: '창원지방검찰청 진주지청', highCourt: '부산고등법원(창원)', courtType: '지원' },
    '남해군': { court: '창원지방법원 진주지원', prosecution: '창원지방검찰청 진주지청', highCourt: '부산고등법원(창원)', courtType: '지원' },
    '하동군': { court: '창원지방법원 진주지원', prosecution: '창원지방검찰청 진주지청', highCourt: '부산고등법원(창원)', courtType: '지원' },
    '산청군': { court: '창원지방법원 진주지원', prosecution: '창원지방검찰청 진주지청', highCourt: '부산고등법원(창원)', courtType: '지원' },
    '통영시': { court: '창원지방법원 통영지원', prosecution: '창원지방검찰청 통영지청', highCourt: '부산고등법원(창원)', courtType: '지원' },
    '거제시': { court: '창원지방법원 통영지원', prosecution: '창원지방검찰청 통영지청', highCourt: '부산고등법원(창원)', courtType: '지원' },
    '고성군': { court: '창원지방법원 통영지원', prosecution: '창원지방검찰청 통영지청', highCourt: '부산고등법원(창원)', courtType: '지원' },
    '밀양시': { court: '창원지방법원 밀양지원', prosecution: '창원지방검찰청 밀양지청', highCourt: '부산고등법원(창원)', courtType: '지원' },
    '창녕군': { court: '창원지방법원 밀양지원', prosecution: '창원지방검찰청 밀양지청', highCourt: '부산고등법원(창원)', courtType: '지원' },
    '거창군': { court: '창원지방법원 거창지원', prosecution: '창원지방검찰청 거창지청', highCourt: '부산고등법원(창원)', courtType: '지원' },
    '함양군': { court: '창원지방법원 거창지원', prosecution: '창원지방검찰청 거창지청', highCourt: '부산고등법원(창원)', courtType: '지원' },
    '합천군': { court: '창원지방법원 거창지원', prosecution: '창원지방검찰청 거창지청', highCourt: '부산고등법원(창원)', courtType: '지원' },
    '양산시': { court: '울산지방법원', prosecution: '울산지방검찰청', highCourt: '부산고등법원', courtType: '본원', notes: '행정구역은 경남이나 사법관할은 울산지법' },
  },
  '제주특별자치도': {
    '제주시': { court: '제주지방법원', prosecution: '제주지방검찰청', highCourt: '광주고등법원(제주)', courtType: '본원' },
    '서귀포시': { court: '제주지방법원', prosecution: '제주지방검찰청', highCourt: '광주고등법원(제주)', courtType: '본원' },
  }
};

/**
 * 시도 및 구군 명칭으로 관할 사법기관 정보를 조회하는 안전한 헬퍼
 */
export function getJurisdiction(sido: string, gugun: string): JurisdictionInfo | null {
  const sidoMap = JURISDICTION_MAP[sido];
  if (!sidoMap) return null;

  // 1. 정확 일치
  if (sidoMap[gugun]) return sidoMap[gugun];

  // 2. 구 단위 분할 지역 보정 (예: 수원시 영통구 -> 수원시)
  const cleanCity = gugun.replace(/(시|군|구).*$/, '$1');
  if (sidoMap[cleanCity]) return sidoMap[cleanCity];

  // 3. 부분 일치 검색
  for (const [districtKey, info] of Object.entries(sidoMap)) {
    if (gugun.includes(districtKey) || districtKey.includes(gugun)) {
      return info;
    }
  }

  return null;
}
