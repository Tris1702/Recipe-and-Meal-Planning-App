/// Lỗi nghiệp vụ mà service chủ động ném ra.
///
/// Mọi lỗi có ý nghĩa với client đều đi qua kiểu này, nhờ vậy route không phải
/// tự dịch lỗi sang HTTP và khuôn lỗi trả về luôn giống nhau.
class AppException implements Exception {
  AppException({
    required this.code,
    required this.httpStatus,
    required this.message,
    this.details = const {},
  });

  /// Mã lỗi ổn định để client so khớp, ví dụ `VALIDATION_FAILED`.
  final String code;

  /// Mã HTTP trả về cho client.
  final int httpStatus;

  /// Thông điệp tiếng Việt hiển thị được cho người dùng.
  final String message;

  /// Dữ liệu bổ sung, ví dụ trường nào sai.
  final Map<String, dynamic> details;

  @override
  String toString() => 'AppException($code, $httpStatus, $message)';
}
