"""Browser smoke tests; requires Python Playwright and Chromium.

Start `npm run dev`, then run `python tests/browser-smoke.py`.
All model requests are intercepted: no API key or paid model calls are required.
"""
import base64
import json
import os
import re
from pathlib import Path

from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
DEMO = json.loads((ROOT / 'shared/demo-report.json').read_text())
BASE = os.environ.get('BASE_URL', 'http://127.0.0.1:5173')
PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRLkAAAAASUVORK5CYII=')


def run():
    checks = []
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        context = browser.new_context(viewport={'width': 1440, 'height': 1000}, accept_downloads=True)
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(BASE, wait_until='domcontentloaded')
        expect(page.get_by_role('heading', name='商品策略工作台.')).to_be_visible()
        expect(page.locator('.selling-card')).to_have_count(5)
        page.screenshot(path='/tmp/zhiwu-desktop.png', full_page=True)
        checks.append('Initial example and five selling-point cards render')

        page.locator('.dimension-filters').get_by_role('button', name='功能', exact=True).click()
        expect(page.locator('.selling-card')).to_have_count(1)
        expect(page.locator('.selling-card h3')).to_have_text(DEMO['sellingPoints'][0]['title'])
        page.locator('.dimension-filters').get_by_role('button', name='全部维度').click()
        expect(page.locator('.selling-card')).to_have_count(5)
        page.get_by_role('tab', name=re.compile('人群分析')).click()
        expect(page.locator('.audience-card')).to_have_count(3)
        page.get_by_role('tab', name=re.compile('场景分析')).click()
        expect(page.locator('.scene-card')).to_have_count(4)
        page.get_by_role('tab', name=re.compile('买点翻译')).click()
        expect(page.locator('.translation-row')).to_have_count(5)
        page.get_by_role('tab', name=re.compile('创意测试矩阵')).click()
        expect(page.locator('.matrix-card')).to_have_count(6)
        page.locator('.segmented').get_by_role('button', name='纯产品', exact=True).click()
        expect(page.locator('.matrix-card')).to_have_count(2)
        page.locator('.matrix-summary').nth(1).click()
        expect(page.locator('.matrix-card.expanded .matrix-detail')).to_contain_text(DEMO['matrix'][1]['middle'])
        page.locator('.segmented').get_by_role('button', name='全部形式').click()
        expect(page.locator('.matrix-card')).to_have_count(6)
        page.locator('.source-panel summary').click()
        expect(page.locator('.source-body')).to_be_visible()
        checks.append('Five modules, dimensions, matrix filters/expansion, and sources work')

        with page.expect_download() as download_info:
            page.get_by_role('button', name='导出报告', exact=True).click()
        export = Path(download_info.value.path()).read_text()
        for title in ['01 产品卖点拆解', '02 人群分析', '03 场景分析', '04 卖点翻译成买点', '05 人群×场景×买点创意测试矩阵']:
            assert title in export, title
        for item in DEMO['matrix']:
            assert item['middle'] in export
        checks.append('Markdown download contains all five modules and all six creative strategies')

        page.get_by_role('button', name='保存报告', exact=True).click()
        page.locator('.primary-nav').get_by_role('button', name=re.compile('我的报告')).click()
        expect(page.locator('.history-card')).to_have_count(1)
        page.get_by_role('button', name='查看报告', exact=False).click()
        expect(page.locator('.report-section')).to_be_visible()
        page.locator('.primary-nav').get_by_role('button', name=re.compile('我的报告')).click()
        page.get_by_role('button', name=re.compile('删除 .* 报告')).click()
        expect(page.locator('.history-card')).to_have_count(0)
        checks.append('Local report save, reopen, and deletion work')

        page.get_by_role('button', name='新建商品分析', exact=True).click()
        expect(page.locator('.product-name input')).to_have_value('')
        expect(page.locator('.report-section')).to_have_count(0)
        page.get_by_role('button', name='生成五项策略分析', exact=False).click()
        expect(page.get_by_role('alert')).to_contain_text('上传产品图片')
        page.locator('input[type=file]').set_input_files({'name': 'bad.gif', 'mimeType': 'image/gif', 'buffer': PNG})
        expect(page.get_by_role('alert')).to_contain_text('JPG、PNG 或 WebP')
        page.locator('input[type=file]').set_input_files({'name': 'test-product.png', 'mimeType': 'image/png', 'buffer': PNG})
        expect(page.locator('.uploaded-image')).to_have_count(1)
        expect(page.locator('.uploaded-image img')).to_have_attribute('alt', 'test-product.png')
        checks.append('New analysis resets state; required input and image types validate; PNG uploads')

        page.locator('.product-name input').fill('测试收纳盒')
        page.locator('.details-field textarea').fill('透明塑料收纳盒，带可拆分隔板，容量 2L。测试资料。')
        page.get_by_role('button', name='生成五项策略分析', exact=False).click()
        expect(page.get_by_role('dialog')).to_be_visible()
        page.locator('input[type=password]').fill('test-key-for-intercept-only')
        page.get_by_role('button', name='保存模型设置', exact=False).click()
        stored = page.evaluate('JSON.stringify(localStorage)')
        assert 'test-key-for-intercept-only' not in stored
        posted = []
        response_report = {**DEMO, 'productName': '测试收纳盒'}
        def mock_success(route):
            posted.append(route.request.post_data_json)
            route.fulfill(status=200, content_type='application/json', body=json.dumps(response_report, ensure_ascii=False))
        page.route('**/api/analyze', mock_success)
        page.get_by_role('button', name='生成五项策略分析', exact=False).click()
        expect(page.locator('.report-badge')).to_have_text('AI 策略报告')
        expect(page.locator('.overview-main b')).to_have_text('测试收纳盒')
        assert posted[0]['productName'] == '测试收纳盒'
        assert posted[0]['details'].startswith('透明塑料收纳盒')
        assert posted[0]['images'][0]['dataUrl'].startswith('data:image/png;base64,')
        assert posted[0]['settings']['apiKey'] == 'test-key-for-intercept-only'
        assert 'test-key-for-intercept-only' not in page.evaluate('JSON.stringify(localStorage)')
        checks.append('Custom product/image reaches analysis request; mocked result renders; Key stays out of storage')

        page.unroute('**/api/analyze', mock_success)
        def mock_error(route):
            route.fulfill(status=429, content_type='application/json', body=json.dumps({'error': '测试模型额度不足，请检查额度后重试。'}, ensure_ascii=False))
        page.route('**/api/analyze', mock_error)
        page.get_by_role('button', name='生成五项策略分析', exact=False).click()
        expect(page.get_by_role('alert')).to_contain_text('测试模型额度不足')
        expect(page.get_by_role('button', name='生成五项策略分析', exact=False)).to_be_enabled()
        checks.append('Model failure is visible and generation can be retried')

        page.reload(wait_until='domcontentloaded')
        page.get_by_role('button', name='新建商品分析', exact=True).click()
        page.locator('.details-field textarea').fill('新的测试产品资料。')
        page.get_by_role('button', name='生成五项策略分析', exact=False).click()
        expect(page.locator('input[type=password]')).to_have_value('')
        checks.append('API key clears on reload')

        page.get_by_role('button', name='关闭弹窗', exact=True).click()
        for attempt in range(12):
            page.locator('.sidebar-settings').click()
            password = page.locator('input[type=password]')
            password.fill('')
            # Sequential keystrokes catch late modal autofocus stealing focus
            # halfway through typing, instead of hiding the race with a wait.
            password.press_sequentially('test-key-for-intercept-only', delay=2)
            expect(password).to_be_focused()
            expect(password).to_have_value('test-key-for-intercept-only')
            expect(page.get_by_role('dialog').locator('input[type=url]')).to_have_value('https://api.openai.com/v1')
            expect(page.get_by_role('dialog').locator('input').nth(1)).to_have_value('gpt-4o-mini')
            page.get_by_role('button', name='保存模型设置', exact=False).click()
            expect(page.get_by_role('dialog')).to_have_count(0)
            assert 'test-key-for-intercept-only' not in page.evaluate('JSON.stringify(localStorage)')
        checks.append('Twelve rapid settings openings retain password focus and never store the test Key')
        assert not errors, errors
        context.close()

        mobile_context = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, device_scale_factor=1)
        mobile = mobile_context.new_page()
        mobile.goto(BASE, wait_until='domcontentloaded')
        expect(mobile.get_by_role('heading', name='商品策略工作台.')).to_be_visible()
        assert mobile.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), mobile.evaluate('({width:window.innerWidth,scroll:document.documentElement.scrollWidth})')
        mobile.screenshot(path='/tmp/zhiwu-mobile.png', full_page=True)
        mobile.get_by_role('button', name='打开导航').click()
        expect(mobile.locator('.sidebar')).to_be_visible()
        mobile.locator('.framework-nav').get_by_role('button', name=re.compile('人群分析')).click()
        expect(mobile.locator('.audience-card')).to_have_count(3)
        expect(mobile.locator('.sidebar')).not_to_have_class(re.compile('open'))
        assert mobile.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
        mobile.get_by_role('tab', name=re.compile('创意测试矩阵')).click()
        expect(mobile.locator('.matrix-card')).to_have_count(6)
        assert mobile.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
        checks.append('390px mobile layout has no overflow; menu/module navigation works')
        mobile_context.close()
        browser.close()
    for check in checks:
        print('PASS:', check)
    print(f'{len(checks)} browser scenarios passed; no JavaScript page errors.')


if __name__ == '__main__':
    run()
