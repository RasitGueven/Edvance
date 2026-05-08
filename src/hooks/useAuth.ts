import { useAuthContext } from '@/context/AuthContext'

// Public Auth-Hook für alle Pages und Komponenten.
// Re-Export aus dem Context, damit Konsumenten nicht direkt
// auf den Context zugreifen müssen.
export const useAuth = useAuthContext
