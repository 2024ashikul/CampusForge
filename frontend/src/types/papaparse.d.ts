declare module 'papaparse' {
  const Papa: {
    parse(file: File, config: {
      complete?: (results: { data: unknown[][]; errors: Array<{ message: string }> }) => void;
      error?: (error: { message: string }) => void;
    }): void;
  };

  export default Papa;
}
