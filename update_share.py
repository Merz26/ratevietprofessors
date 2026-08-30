import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Institution Share Button
inst_btn_group = """          <ButtonGroup align="end">
            <Button"""

inst_share = """          <ButtonGroup align="end">
            <Button
              variant="neutral"
              size="small"
              iconStart={<Share2 size={16} />}
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                showToast('Đã sao chép liên kết!', 'success');
              }}
            >
              Chia sẻ
            </Button>
            <Button"""

content = content.replace(inst_btn_group, inst_share)

with open('src/App.tsx', 'w') as f:
    f.write(content)
