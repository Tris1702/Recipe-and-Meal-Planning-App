import 'package:dart_frog/dart_frog.dart';

/// Điểm kiểm tra sức khoẻ cho hạ tầng triển khai.
Response onRequest(RequestContext context) {
  return Response.json(body: {'status': 'ok'});
}
