import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    //in the format of MIME; type, subtype
    'Content-Type': 'application/json',
  },
  // The Ticketmaster fan-out can legitimately take a while on a cold cache,
  // so this is generous enough not to abort a working request.
  timeout: 30000,
});

/** Error type the UI can render, instead of a silent empty array. */
export class ApiError extends Error {
  readonly isNetworkError: boolean;
  readonly status?: number;

  constructor(message: string, isNetworkError: boolean, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.isNetworkError = isNetworkError;
    this.status = status;
  }
}

/**
 * Turn an axios failure into something worth showing a user.
 *
 * The distinction that matters is "the backend is not running" versus "the
 * backend answered with an error" - previously both were swallowed and the map
 * just rendered empty, which is indistinguishable from "no events here".
 */
export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const message =
        (error.response.data as { message?: string } | undefined)?.message ??
        `Request failed with status ${error.response.status}`;
      return new ApiError(message, false, error.response.status);
    }
    if (error.code === 'ECONNABORTED') {
      return new ApiError('The request timed out. The server may be busy.', true);
    }
    return new ApiError(
      `Could not reach the Spotlight backend at ${API_BASE_URL}. Is it running?`,
      true
    );
  }
  return new ApiError(
    error instanceof Error ? error.message : 'An unexpected error occurred.',
    false
  );
}

//error handling, runs on every response from the server
//.interceptors -> acess interceptor
//.response -> response interceptor (not a request interceptor)
//.use -> register a new interceptor
apiClient.interceptors.response.use(
    //first function -> sucess handler
        //if sucess, just passes the response through unchanged n returns response
    (response) => response,
    //second function -> error handler
        //it runs when the request fails, logs the error, then throws it
    (error) => {
        //error.response -> status of the error
        //.data -> {message : ' ... ', error: ' ... ' }
        console.error('API Error:', error.response?.data || error.message);
        //rethrow the error
            //passes the error to the catch block, so it can be handled
        return Promise.reject(error);
  }
);
