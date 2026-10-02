<?php
require __DIR__ . '/lib.php';
assert(validate_phone('081234567890') === true);
assert(validate_phone('6281234567890') === true);
assert(validate_phone('12345') === false);
assert(validate_attendance('hadir') === true);
assert(validate_attendance('maybe') === false);
echo "validation ok\n";
