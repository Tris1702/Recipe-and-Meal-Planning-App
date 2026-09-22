import 'dart:io';

import 'package:api/src/db/migration_files.dart';
import 'package:test/test.dart';

Directory _dirWith(List<String> fileNames) {
  final dir = Directory.systemTemp.createTempSync('migrations_test');
  addTearDown(() => dir.deleteSync(recursive: true));
  for (final name in fileNames) {
    File('${dir.path}/$name').writeAsStringSync('SELECT 1;');
  }
  return dir;
}

void main() {
  test('migration chạy theo thứ tự số, không theo thứ tự chuỗi', () {
    final dir = _dirWith(['10_later.sql', '2_earlier.sql', '1_first.sql']);

    final found = discoverMigrations(dir.path);

    expect(found.map((m) => m.version), [1, 2, 10]);
    expect(found.map((m) => m.name), ['1_first.sql', '2_earlier.sql', '10_later.sql']);
  });

  test('tệp không phải .sql không được coi là migration', () {
    final dir = _dirWith(['0001_ok.sql', 'README.md', '0002_ok.sql.bak']);

    expect(discoverMigrations(dir.path).map((m) => m.name), ['0001_ok.sql']);
  });

  test('tệp .sql không mở đầu bằng số bị từ chối, báo rõ tệp nào', () {
    final dir = _dirWith(['0001_ok.sql', 'thieu_so_hieu.sql']);

    expect(
      () => discoverMigrations(dir.path),
      throwsA(
        isA<FormatException>().having(
          (e) => e.message,
          'message',
          contains('thieu_so_hieu.sql'),
        ),
      ),
    );
  });
}
