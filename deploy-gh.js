const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const WEB_DIST_DIR = path.join(__dirname, 'dist', 'web');

console.log('🚀 开始部署到 GitHub Pages...\n');

try {
  // 检查 gh-pages 包
  console.log('📦 检查 gh-pages 依赖...');
  try {
    execSync('npm list gh-pages', { cwd: __dirname, stdio: 'pipe' });
  } catch {
    console.log('安装 gh-pages...');
    execSync('npm install -D gh-pages', { cwd: __dirname, stdio: 'inherit' });
  }

  // 清理并创建 dist/web 目录
  if (fs.existsSync(WEB_DIST_DIR)) {
    fs.rmSync(WEB_DIST_DIR, { recursive: true });
  }
  fs.mkdirSync(WEB_DIST_DIR, { recursive: true });

  // 复制 src 目录所有内容到 dist/web
  console.log('📁 复制文件到 dist/web...');
  const copyRecursive = (src, dest) => {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const items = fs.readdirSync(src);
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      const stat = fs.statSync(srcPath);
      if (stat.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };
  copyRecursive(SRC_DIR, WEB_DIST_DIR);

  // 修正 sw.js 中的路径（去除开头斜杠以支持相对路径）
  const swPath = path.join(WEB_DIST_DIR, 'sw.js');
  if (fs.existsSync(swPath)) {
    let swContent = fs.readFileSync(swPath, 'utf8');
    swContent = swContent.replace(/'\//g, "'./");
    fs.writeFileSync(swPath, swContent);
    console.log('✅ 修正 Service Worker 路径');
  }

  console.log('\n🚀 部署到 gh-pages 分支...');
  execSync('npx gh-pages -d dist/web', { cwd: __dirname, stdio: 'inherit' });

  console.log('\n✅ 部署成功!');
  console.log('\n📱 访问地址：https://sryuz.github.io/random-selector/');
  console.log('💡 在 iPhone Safari 中：点击分享按钮 -> 添加到主屏幕，即可作为 PWA 使用\n');

} catch (error) {
  console.error('❌ 部署失败:', error.message);
  process.exit(1);
}
