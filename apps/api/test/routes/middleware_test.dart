import 'dart:convert';

import 'package:api/src/error/app_exception.dart';
import 'package:dart_frog/dart_frog.dart';
import 'package:mocktail/mocktail.dart';
import 'package:test/test.dart';

import '../../routes/_middleware.dart' as root;

class _MockRequestContext extends Mock implements RequestContext {}

void main() {
  test('mọi route đều được bọc bằng khuôn lỗi chung', () async {
    final handler = root.middleware(
      (_) => throw AppException(
        code: 'NOT_FOUND',
        httpStatus: 404,
        message: 'Không tìm thấy công thức',
      ),
    );

    final response = await handler(_MockRequestContext());
    final body = jsonDecode(await response.body()) as Map<String, dynamic>;

    expect(response.statusCode, 404);
    expect((body['error'] as Map<String, dynamic>)['code'], 'NOT_FOUND');
  });
}
