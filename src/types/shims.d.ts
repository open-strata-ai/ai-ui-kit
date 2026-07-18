// Optional OSS dependencies are loaded lazily at runtime via dynamic import and
// gracefully degrade when not installed. Declare them here so `tsc` stays green
// without forcing the heavy dependencies into the install graph (DESIGN §4.1
// anti-corrosion layer).
declare module 'mermaid';
