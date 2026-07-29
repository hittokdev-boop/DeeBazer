const fs = require('fs');
const path = require('path');

const screenDir = path.join(__dirname, 'Src', 'Screen');
const navigationFile = path.join(__dirname, 'Src', 'Navigation.js');

const groups = {
  'AuthProfile': ['Account.js', 'EditProfile.js'],
  'CartCheckout': ['CartPage.js', 'Coupons.js', 'RazorpayScreen.js'],
  'Address': ['AllAdress.js', 'SaveAddress.js', 'UpdateAddress.js', 'MapScreen.js'],
  'ProductsDashboard': ['DashBoard.js', 'Home.js', 'ViewAllProducts.js', 'ProductDetails.js'],
  'Orders': ['Orders.js', 'OrderDetails.js'],
  'Misc': ['HelpCenter.js', 'TermsCondition.js', 'SplashScreen.js', 'wishlist .js', 'Text.js']
};

// 1. Create directories
Object.keys(groups).forEach(dir => {
  const dirPath = path.join(screenDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// 2. Move files and update their internal imports
Object.entries(groups).forEach(([dir, files]) => {
  files.forEach(file => {
    const oldPath = path.join(screenDir, file);
    const newPath = path.join(screenDir, dir, file);
    
    if (fs.existsSync(oldPath)) {
      let content = fs.readFileSync(oldPath, 'utf8');
      
      // Update relative imports: ../ becomes ../../
      // This regex handles both import from '../...' and require('../...')
      content = content.replace(/(from\s+['"]|require\(['"])(?:\.\/)?(\.\.\/)/g, '$1../$2');
      
      fs.writeFileSync(newPath, content, 'utf8');
      fs.unlinkSync(oldPath);
      console.log(`Moved ${file} to ${dir}/`);
    } else {
      console.log(`File not found: ${file}`);
    }
  });
});

// 3. Update Navigation.js
if (fs.existsSync(navigationFile)) {
  let navContent = fs.readFileSync(navigationFile, 'utf8');
  
  Object.entries(groups).forEach(([dir, files]) => {
    files.forEach(file => {
      // Remove extension for matching
      const baseName = file.replace('.js', '');
      
      // We are looking for something like: import X from './Screen/Account'
      // Or: import Wishlist from './Screen/wishlist '
      
      // Escape for regex
      const safeBase = baseName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      
      // Pattern to match './Screen/BaseName'
      const regex = new RegExp(`'\\.\\/Screen\\/${safeBase}'`, 'g');
      
      navContent = navContent.replace(regex, `'./Screen/${dir}/${baseName}'`);
      
      // Also check double quotes just in case
      const regex2 = new RegExp(`"\\.\\/Screen\\/${safeBase}"`, 'g');
      navContent = navContent.replace(regex2, `"./Screen/${dir}/${baseName}"`);
    });
  });
  
  fs.writeFileSync(navigationFile, navContent, 'utf8');
  console.log('Updated Navigation.js');
}

console.log('Migration complete.');
