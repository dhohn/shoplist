// Verbose logging — enable in browser console with:
//   localStorage.setItem('shoplist:debug', 'true')
// Disable with:
//   localStorage.removeItem('shoplist:debug')

export function log(...args) {
  if (localStorage.getItem('shoplist:debug') === 'true') {
    console.log('[shoplist]', new Date().toISOString(), ...args);
  }
}
