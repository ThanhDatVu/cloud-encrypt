export enum SHARP_IMAGE_TYPE {
  avif = "avif",
  dz = "dz",
  fits = "fits",
  gif = "gif",
  heif = "heif",
  input = "input",
  jpeg = "jpeg",
  jpg = "jpg",
  magick = "magick",
  openslide = "openslide",
  pdf = "pdf",
  png = "png",
  ppm = "ppm",
  raw = "raw",
  svg = "svg",
  tiff = "tiff",
  tif = "tif",
  v = "v",
  webp = "webp",
}

export enum SHARP_AUDIO_TYPE {
  "wav" = "wav",
  "bwf" = "bwf",
  "aiff" = "aiff",
  "flac" = "flac",
  "m4a" = "m4a",
  "pac" = "pac",
  "tta" = "tta",
  "wv" = "wv",
  "ast" = "ast",
  "aac" = "aac",
  "mp2" = "mp2",
  "mp3" = "mp3",
  "amr" = "amr",
  "s3m" = "s3m",
  "act" = "act",
  "au" = "au",
  "dct" = "dct",
  "dss" = "dss",
  "gsm" = "gsm",
  "m4p" = "m4p",
  "mmf" = "mmf",
  "mpc" = "mpc",
  "ogg" = "ogg",
  "oga" = "oga",
  "opus" = "opus",
  "ra" = "ra",
  "sln" = "sln",
  "vox" = "vox",
}

export enum SHARP_VIDEO_TYPE {
  "3g2" = "3g2",
  "3gp" = "3gp",
  "aaf" = "aaf",
  "asf" = "asf",
  "avchd" = "avchd",
  "avi" = "avi",
  "drc" = "drc",
  "flv" = "flv",
  "m2v" = "m2v",
  "m3u8" = "m3u8",
  "m4v" = "m4v",
  "mkv" = "mkv",
  "mng" = "mng",
  "mov" = "mov",
  "mp4" = "mp4",
  "mpe" = "mpe",
  "mpeg" = "mpeg",
  "mpg" = "mpg",
  "mpv" = "mpv",
  "mxf" = "mxf",
  "nsv" = "nsv",
  "ogv" = "ogv",
  "qt" = "qt",
  "rm" = "rm",
  "rmvb" = "rmvb",
  "roq" = "roq",
  "svi" = "svi",
  "vob" = "vob",
  "webm" = "webm",
  "wmv" = "wmv",
  "yuv" = "yuv",
}

//document type
export enum SHARP_DOCUMENT_TYPE {
  "doc" = "doc",
  "docx" = "docx",
  "pdf" = "pdf",
  "rtf" = "rtf",
  "tex" = "tex",
  "txt" = "txt",
  "wpd" = "wpd",
  "wps" = "wps",
  "xls" = "xls",
  "xlsx" = "xlsx",
  "csv" = "csv",
  "ppt" = "ppt",
  "pptx" = "pptx",
}
export const ALL_FILE_TYPES = {
  ...SHARP_IMAGE_TYPE,
  ...SHARP_AUDIO_TYPE,
  ...SHARP_VIDEO_TYPE,
  ...SHARP_DOCUMENT_TYPE,
}

export const toSlug = (str: string) => {
  // Chuyển hết sang chữ thường
  str = str.toLowerCase();
  // xóa dấu
  str = str
    .normalize('NFD') // chuyển chuỗi sang unicode tổ hợp
    .replace(/[\u0300-\u036f]/g, ''); // xóa các ký tự dấu sau khi tách tổ hợp
  // Thay ký tự đĐ
  str = str.replace(/[đĐ]/g, 'd');
  // Xóa ký tự đặc biệt
  str = str.replace(/([^0-9a-z-\s])/g, '');
  // Xóa khoảng trắng thay bằng ký tự -
  str = str.replace(/(\s+)/g, '-');
  // Xóa ký tự - liên tiếp
  str = str.replace(/-+/g, '-');
  // xóa phần dư - ở đầu & cuối
  str = str.replace(/^-+|-+$/g, '');
  // return
  return str;
}