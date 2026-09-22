import 'dart:io';

import 'package:api/src/error/app_exception.dart';
import 'package:dart_frog/dart_frog.dart';

/// Dịch exception ném ra từ handler thành khuôn lỗi JSON chung.
///
/// Lỗi nghiệp vụ ([AppException]) giữ nguyên mã và thông điệp của nó. Mọi lỗi
/// khác thành `500 INTERNAL` với thông điệp trung tính: chi tiết kỹ thuật chỉ
/// đi vào log của máy chủ, không bao giờ đi ra client.
Middleware errorMapper() {
  return (handler) {
    return (context) async {
      try {
        return await handler(context);
      } on AppException catch (e) {
        return _envelope(e.httpStatus, e.code, e.message, e.details);
      } catch (e, stackTrace) {
        stderr.writeln('unhandled error: $e\n$stackTrace');
        return _envelope(500, 'INTERNAL', 'Lỗi hệ thống', const {});
      }
    };
  };
}

Response _envelope(
  int status,
  String code,
  String message,
  Map<String, dynamic> details,
) {
  return Response.json(
    statusCode: status,
    body: {
      'error': {'code': code, 'message': message, 'details': details},
    },
  );
}
