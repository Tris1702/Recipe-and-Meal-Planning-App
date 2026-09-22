import 'dart:convert';

import 'package:api/src/error/app_exception.dart';
import 'package:api/src/middleware/error_mapper.dart';
import 'package:dart_frog/dart_frog.dart';
import 'package:mocktail/mocktail.dart';
import 'package:test/test.dart';

class _MockRequestContext extends Mock implements RequestContext {}

Handler _wrap(Handler handler) => errorMapper()(handler);

void main() {
  test('AppException được map thành khuôn lỗi chung', () async {
    final handler = _wrap(
      (_) => throw AppException(
        code: 'VALIDATION_FAILED',
        httpStatus: 422,
        message: 'Thiếu bước nấu',
        details: const {'field': 'steps'},
      ),
    );

    final response = await handler(_MockRequestContext());
    final body = jsonDecode(await response.body()) as Map<String, dynamic>;
    final error = body['error'] as Map<String, dynamic>;

    expect(response.statusCode, 422);
    expect(error['code'], 'VALIDATION_FAILED');
    expect(error['message'], 'Thiếu bước nấu');
    expect(error['details'], {'field': 'steps'});
  });

  test('lỗi ngoài dự kiến thành 500 và không lộ chi tiết kỹ thuật', () async {
    final handler = _wrap(
      (_) => throw StateError('mật khẩu kết nối db sai: postgres://app:secret@db'),
    );

    final response = await handler(_MockRequestContext());
    final body = jsonDecode(await response.body()) as Map<String, dynamic>;
    final error = body['error'] as Map<String, dynamic>;

    expect(response.statusCode, 500);
    expect(error['code'], 'INTERNAL');
    expect(error['message'], isNot(contains('secret')));
    expect(error['details'], isEmpty);
  });
}
