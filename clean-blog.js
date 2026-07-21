const fs = require('fs');
let content = fs.readFileSync('src/app/(public)/blog/BlogPageClient.tsx', 'utf8');

content = content.replace(/import standardData from '\.\.\/\.\.\/\.\.\/\.\.\/functions\/api\/taas-standard-data\.json';\r?\n/, '');
content = content.replace(/import HospitalSitemap from '@\/components\/HospitalSitemap';\r?\n/, '');
content = content.replace(/import \{ REGIONS_DATA, KAKAO_OPEN_CHAT_URL, GOOGLE_FORM_URL \} from '@\/lib\/constants';/, "import { KAKAO_OPEN_CHAT_URL, GOOGLE_FORM_URL } from '@/lib/constants';");

content = content.replace(/interface HiraData[\s\S]*?function HospitalListView[\s\S]*?return \([\s\S]*?\}\n\n/m, '');

const replacement = `export default function BlogPageClient() {
  const searchParams = useSearchParams();
  const tagFilter = searchParams.get('tag');
  const categoryFilter = searchParams.get('category');

  const [posts, setPosts] = useState<Post[]>([]);

  // 포스트 목록 로드 (API를 통해)
  useEffect(() => {
    fetch('/api/posts')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        // 날짜 최신순 정렬
        list.sort((a: Post, b: Post) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
        setPosts(list);
      })
      .catch(() => setPosts([]));
  }, []);

  // 태그 및 카테고리 필터링
  let displayPosts = posts;`;

content = content.replace(/export default function BlogPageClient\(\) \{[\s\S]*?\/\/ 태그 및 카테고리 필터링\r?\n\s*let displayPosts = posts;/m, replacement);

fs.writeFileSync('src/app/(public)/blog/BlogPageClient.tsx', content, 'utf8');
