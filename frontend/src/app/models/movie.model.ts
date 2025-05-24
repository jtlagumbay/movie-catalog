export interface Movie {
  id: number;
  title: string;
  description: string;
  date_added: string;
  video_file: string;
  video_url: string;
  video_info: object;
  thumbnail: string;
  is_liked: boolean;
}

export interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  fps: number;
  size: number;
}