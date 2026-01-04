
import sys

def check_html_balance(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    stack = []
    for i, line in enumerate(lines):
        line_num = i + 1
        # Simple regex-like search for tags
        import re
        tags = re.findall(r'<(div|main|section|span|lucide-angular)|</(div|main|section|span|lucide-angular)>', line)
        for open_tag, close_tag in tags:
            if open_tag:
                stack.append((open_tag, line_num))
            if close_tag:
                if not stack:
                    print(f"Error: Unexpected closing tag </{close_tag}> at line {line_num}")
                else:
                    last_tag, last_line = stack.pop()
                    if last_tag != close_tag:
                        print(f"Error: Mismatched tag. Opening <{last_tag}> at line {last_line} closed by </{close_tag}> at line {line_num}")

    while stack:
        tag, line = stack.pop()
        print(f"Error: Unclosed tag <{tag}> at line {line}")

if __name__ == "__main__":
    check_html_balance(sys.argv[1])
