import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

prof_btn_group = """            <ButtonGroup align="justify">
              <Button
                variant="neutral"
                iconStart={<GitCompare size={16} />}
                onClick={() => { setCompareProf(null); setCompareSearch(''); setCompareUniv(''); setCompareDept(''); setCompareModal(true) }}
              >
                So sánh
              </Button>"""

prof_share = """            <ButtonGroup align="justify">
              <div className="flex items-center gap-md">
                <Button
                  variant="neutral"
                  iconStart={<Share2 size={16} />}
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    showToast('Đã sao chép liên kết!', 'success');
                  }}
                >
                  Chia sẻ
                </Button>
                <Button
                  variant="neutral"
                  iconStart={<GitCompare size={16} />}
                  onClick={() => { setCompareProf(null); setCompareSearch(''); setCompareUniv(''); setCompareDept(''); setCompareModal(true) }}
                >
                  So sánh
                </Button>
              </div>"""

content = content.replace(prof_btn_group, prof_share)

with open('src/App.tsx', 'w') as f:
    f.write(content)
