import 'package:api/src/middleware/error_mapper.dart';
import 'package:dart_frog/dart_frog.dart';

/// Middleware gốc: mọi route dưới `routes/` đều đi qua đây.
Handler middleware(Handler handler) {
  return handler.use(errorMapper());
}
