"""Pure integer contract tests for cookies-plates-reverse.html."""
import math

S0 = 12

def reverse(n, minimum, pack):
    need = n * minimum
    deficit = max(0, need - S0)
    k = max(0, math.ceil(deficit / pack))
    bought = k * pack
    total = S0 + bought
    return need, deficit, k, bought, total, total // n, total % n

# brief example: remainder is permitted
assert reverse(3, 6, 4) == (18, 6, 2, 8, 20, 6, 2)
# stated control with pack 8
assert reverse(4, 8, 8) == (32, 20, 3, 24, 36, 9, 0)
# same control, different allowed pack
assert reverse(4, 8, 6) == (32, 20, 4, 24, 36, 9, 0)
# sufficient starting stock means no purchase
assert reverse(3, 4, 3) == (12, 0, 0, 0, 12, 4, 0)
# non-divisible deficit still selects a whole pack
assert reverse(5, 3, 4) == (15, 3, 1, 4, 16, 3, 1)

print('5 reverse-calculation contract cases passed')
