@Tags(['integration'])
library;

import 'package:api/src/db/migrator.dart';
import 'package:test/test.dart';

import '../support/test_database.dart';

void main() {
  test('chạy migration hai lần chỉ áp dụng một lần', () async {
    final conn = await openTestConnection();
    addTearDown(conn.close);

    final first = await runMigrations(conn, migrationsDirectory);
    final second = await runMigrations(conn, migrationsDirectory);

    expect(first, contains('0001_extensions_and_enums.sql'));
    expect(second, isEmpty);
  });

  test('immutable_unaccent bỏ dấu tiếng Việt và hạ chữ thường', () async {
    final conn = await openTestConnection();
    addTearDown(conn.close);
    await runMigrations(conn, migrationsDirectory);

    final result = await conn.execute("SELECT immutable_unaccent('Phở Bò')");

    expect(result.first.first, 'pho bo');
  });
}
