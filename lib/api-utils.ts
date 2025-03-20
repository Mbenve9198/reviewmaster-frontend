/**
 * Funzione di utilità per gestire gli errori API, in particolare per token scaduto (401)
 * @param response La risposta fetch da verificare
 * @returns Lo stesso response se non ci sono errori
 * @throws Error se la risposta non è ok
 */
export const handleApiResponse = async (response: Response): Promise<Response> => {
  if (response.ok) {
    return response;
  }

  // Gestisci errore 401 in modo consistente (token scaduto)
  if (response.status === 401) {
    console.log('Token scaduto o non valido, reindirizzamento al login...');
    
    // Rimuovi il token dai cookie e dal localStorage
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Reindirizza alla pagina di login
    if (typeof window !== 'undefined') {
      window.location.href = '/login?expired=true';
    }
  }

  // Per altri errori, permettiamo al chiamante di gestirli
  const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
  throw new Error(errorData.message || `API error: ${response.status}`);
};

/**
 * Wrapper per fetch che gestisce automaticamente gli errori 401
 * @param url URL dell'API
 * @param options Opzioni fetch
 * @returns Il risultato della chiamata fetch
 */
export const apiFetch = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, options);
  await handleApiResponse(response);
  return await response.json();
}; 