package model

import (
	"time"

	"github.com/shopspring/decimal"
)

// InterestRate represents a bank interest rate entry
type InterestRate struct {
	ID            int64           `db:"id" json:"id"`
	BankCode      string          `db:"bank_code" json:"bankCode"`
	BankName      string          `db:"bank_name" json:"bankName"`
	BankLogo      string          `db:"bank_logo" json:"bankLogo,omitempty"`
	ProductType   string          `db:"product_type" json:"productType"` // deposit, loan, mortgage
	TermMonths    int             `db:"term_months" json:"termMonths"`
	TermLabel     string          `db:"term_label" json:"termLabel"` // "1 tháng", "3 tháng", etc.
	Rate          decimal.Decimal `db:"rate" json:"rate"`
	MinAmount     decimal.Decimal `db:"min_amount" json:"minAmount,omitempty"`
	MaxAmount     decimal.Decimal `db:"max_amount" json:"maxAmount,omitempty"`
	Currency      string          `db:"currency" json:"currency"`
	EffectiveDate time.Time       `db:"effective_date" json:"effectiveDate"`
	ScrapedAt     time.Time       `db:"scraped_at" json:"scrapedAt"`
	CreatedAt     time.Time       `db:"created_at" json:"createdAt"`
	UpdatedAt     time.Time       `db:"updated_at" json:"updatedAt"`
}

// Bank represents a Vietnamese bank
type Bank struct {
	Code    string `json:"code"`
	Name    string `json:"name"`
	NameVi  string `json:"nameVi"`
	Logo    string `json:"logo"`
	Website string `json:"website"`
}

// VietnameseBanks is a list of major Vietnamese banks
// Logo URLs use publicly accessible images from bank websites or reliable CDNs
var VietnameseBanks = []Bank{
	{Code: "vcb", Name: "Vietcombank", NameVi: "Ngân hàng TMCP Ngoại thương Việt Nam", Logo: "https://upload.wikimedia.org/wikipedia/vi/thumb/c/c2/Vietcombank_logo.svg/200px-Vietcombank_logo.svg.png", Website: "https://www.vietcombank.com.vn"},
	{Code: "tcb", Name: "Techcombank", NameVi: "Ngân hàng TMCP Kỹ thương Việt Nam", Logo: "https://upload.wikimedia.org/wikipedia/vi/thumb/7/77/Techcombank_logo.svg/200px-Techcombank_logo.svg.png", Website: "https://techcombank.com"},
	{Code: "mb", Name: "MB Bank", NameVi: "Ngân hàng TMCP Quân đội", Logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Logo_MB_new.png/200px-Logo_MB_new.png", Website: "https://www.mbbank.com.vn"},
	{Code: "bidv", Name: "BIDV", NameVi: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam", Logo: "https://upload.wikimedia.org/wikipedia/vi/thumb/7/7a/BIDV_Logo.svg/200px-BIDV_Logo.svg.png", Website: "https://www.bidv.com.vn"},
	{Code: "agribank", Name: "Agribank", NameVi: "Ngân hàng Nông nghiệp và Phát triển Nông thôn", Logo: "https://upload.wikimedia.org/wikipedia/vi/thumb/1/1c/Agribank_logo.svg/200px-Agribank_logo.svg.png", Website: "https://www.agribank.com.vn"},
	{Code: "vpbank", Name: "VPBank", NameVi: "Ngân hàng TMCP Việt Nam Thịnh Vượng", Logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/VPBank_logo.svg/200px-VPBank_logo.svg.png", Website: "https://www.vpbank.com.vn"},
	{Code: "acb", Name: "ACB", NameVi: "Ngân hàng TMCP Á Châu", Logo: "https://upload.wikimedia.org/wikipedia/vi/thumb/a/a6/ACB_logo.svg/200px-ACB_logo.svg.png", Website: "https://www.acb.com.vn"},
	{Code: "sacombank", Name: "Sacombank", NameVi: "Ngân hàng TMCP Sài Gòn Thương Tín", Logo: "https://upload.wikimedia.org/wikipedia/vi/thumb/5/5c/Sacombank_Logo.svg/200px-Sacombank_Logo.svg.png", Website: "https://www.sacombank.com.vn"},
	{Code: "tpbank", Name: "TPBank", NameVi: "Ngân hàng TMCP Tiên Phong", Logo: "https://upload.wikimedia.org/wikipedia/vi/thumb/c/c3/TPBank_logo.svg/200px-TPBank_logo.svg.png", Website: "https://tpb.vn"},
	{Code: "hdbank", Name: "HDBank", NameVi: "Ngân hàng TMCP Phát triển TP.HCM", Logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/HDBank_Logo.svg/200px-HDBank_Logo.svg.png", Website: "https://www.hdbank.com.vn"},
}

// StandardTerms defines common deposit term periods in months
var StandardTerms = []struct {
	Months int
	Label  string
}{
	{0, "Không kỳ hạn"},
	{1, "1 tháng"},
	{3, "3 tháng"},
	{6, "6 tháng"},
	{9, "9 tháng"},
	{12, "12 tháng"},
	{18, "18 tháng"},
	{24, "24 tháng"},
	{36, "36 tháng"},
}
