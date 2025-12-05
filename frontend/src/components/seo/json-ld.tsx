interface JsonLdProps {
  data: Record<string, unknown>
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function WebApplicationJsonLd({ locale }: { locale: string }) {
  const isVi = locale === 'vi'
  
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'WealthPath',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description: isVi
      ? 'Ứng dụng quản lý tài chính cá nhân - theo dõi chi tiêu, ngân sách và mục tiêu tiết kiệm'
      : 'Personal finance management app - track expenses, budgets, and savings goals',
    url: 'https://wealthpath.duckdns.org',
    inLanguage: isVi ? 'vi' : 'en',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    featureList: isVi
      ? [
          'Theo dõi thu nhập và chi tiêu',
          'Quản lý ngân sách thông minh',
          'Mục tiêu tiết kiệm',
          'Quản lý nợ',
          'Giao dịch định kỳ',
          'Báo cáo tài chính',
        ]
      : [
          'Income & expense tracking',
          'Smart budgeting',
          'Savings goals',
          'Debt management',
          'Recurring transactions',
          'Financial reports',
        ],
    screenshot: 'https://wealthpath.duckdns.org/og-image.png',
  }

  return <JsonLd data={data} />
}

export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'WealthPath',
    url: 'https://wealthpath.duckdns.org',
    logo: 'https://wealthpath.duckdns.org/logo.png',
    sameAs: [
      // Add social media URLs when available
    ],
  }

  return <JsonLd data={data} />
}

export function BreadcrumbJsonLd({ 
  items 
}: { 
  items: Array<{ name: string; url: string }> 
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return <JsonLd data={data} />
}

export function FAQJsonLd({ 
  faqs,
  locale 
}: { 
  faqs: Array<{ question: string; answer: string }>
  locale: string 
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: locale,
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return <JsonLd data={data} />
}



