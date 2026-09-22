import 'dart:io';

/// Một tệp migration trên đĩa, đã tách sẵn số hiệu.
class MigrationFile {
  MigrationFile({required this.version, required this.name, required this.path});

  /// Số hiệu lấy từ phần đầu tên tệp, ví dụ `0002_users.sql` cho ra `2`.
  final int version;

  /// Tên tệp, ghi vào `schema_migrations` để người sau đọc log hiểu ngay.
  final String name;

  final String path;

  String readSql() => File(path).readAsStringSync();
}

/// Liệt kê migration trong [dirPath] theo đúng thứ tự phải chạy.
///
/// Thứ tự là **số học** chứ không phải chuỗi: `10_x.sql` chạy sau `2_x.sql`,
/// dù so sánh chuỗi sẽ xếp ngược lại.
List<MigrationFile> discoverMigrations(String dirPath) {
  final files = Directory(dirPath)
      .listSync()
      .whereType<File>()
      .where((f) => f.path.endsWith('.sql'))
      .map((f) {
        final name = f.uri.pathSegments.last;
        final version = int.tryParse(name.split('_').first);
        if (version == null) {
          throw FormatException(
            'Tên migration phải mở đầu bằng số hiệu, ví dụ 0001_ten.sql: $name',
          );
        }
        return MigrationFile(version: version, name: name, path: f.path);
      })
      .toList()
    ..sort((a, b) => a.version.compareTo(b.version));

  return files;
}
