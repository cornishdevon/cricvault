function readPackage(pkg, context) {
  if (pkg.name === 'react-native-worklets') {
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies['@babel/generator'] = '>=7.0.0';
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
