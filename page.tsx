import { Product } from "@medusajs/medusa"
import { Metadata } from "next"
import { getCollectionsList, getProductsList, getRegion, getCategoriesList, listCategories } from "@lib/data"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import StyleBanner from "@modules/home/components/style-banner"
// import CategoryBanner from "@modules/home/components/category-banner"
// import Categories from "@modules/home/components/categories"
import Categories from "@modules/home/components/category"
import CollectionBanner from "@modules/home/components/collection-banner"
import BinaryBanner from "@modules/layout/components/binary-banner"
import HashtagGrid from "@modules/layout/components/canva-grid"
import DiscountBanner from "@modules/layout/components/discount-banner"
import GiftGuideBanner from "@modules/home/components/gift-banner"

import { ProductCollectionWithPreviews } from "types/global"
import { CategoryWithMetadata } from "types/global"
import { cache } from "react"

export const metadata: Metadata = {
  title: "Mersate Fashion",
  description:
    "Best Fashion Brand in India",
}

const getCollectionsWithProducts = cache(
  async (
    countryCode: string
  ): Promise<ProductCollectionWithPreviews[] | null> => {
    const { collections } = await getCollectionsList(0, 6)

    if (!collections) {
      return null
    }

    const collectionIds = collections.map((collection) => collection.id)

    await Promise.all(
      collectionIds.map((id) =>
        getProductsList({
          queryParams: { collection_id: [id] },
          countryCode,
        })
      )
    ).then((responses) =>
      responses.forEach(({ response, queryParams }) => {
        let collection

        if (collections) {
          collection = collections.find(
            (collection) => collection.id === queryParams?.collection_id?.[0]
          )
        }

        if (!collection) {
          return
        }

        collection.products = response.products as unknown as Product[]
      })
    )

    return collections as unknown as ProductCollectionWithPreviews[]
  }
)

const getCategoryWithProducts = cache(
  async (
    countryCode: string
  ): Promise<CategoryWithMetadata[] | null> => {
    const categories = await listCategories();
    
    if (!categories) {
      return null
    }
    
    return categories as unknown as CategoryWithMetadata[];
  }
)

// Component wrapper for consistent spacing
const SectionWrapper = ({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode
  className?: string 
}) => {
  return (
    <div className={`w-full ${className}`}>
      {children}
    </div>
  )
}

export default async function Home({
  params: { countryCode },
}: {
  params: { countryCode: string }
}) {
  const collections = await getCollectionsWithProducts(countryCode)
  const region = await getRegion(countryCode)
  const categories = await getCategoryWithProducts(countryCode)

  if (!collections || !region || !categories) {
    return null
  }

  const { product_categories } = await getCategoriesList(0, 6)

  return (
    <>
      <Hero />
      <div className="py-12">
        <div className="flex flex-col">
          <SectionWrapper className="mb-24">
            <FeaturedProducts collections={collections} region={region} />
          </SectionWrapper>

          <SectionWrapper className="mb-16">
            <GiftGuideBanner />
          </SectionWrapper>

          

          {/* <SectionWrapper className="mb-16">
            <StyleBanner />
          </SectionWrapper> */}

          {/* <SectionWrapper className="mb-2">
            <CollectionBanner />
          </SectionWrapper> */}

          {/* <SectionWrapper className="mb-16">
            <BinaryBanner />
          </SectionWrapper> */}

          {/* <SectionWrapper className="mb-20">
            <HashtagGrid />
          </SectionWrapper> */}

          <SectionWrapper className="mb-1">
            <DiscountBanner />
          </SectionWrapper>
        </div>
      </div>
    </>
  )
}