// Bridge module: redirects shared contexts' `import { useAuth } from './AuthContext'`
// to the extension's auth implementation
export { useExtAuth as useAuth } from './components/LoginForm';
