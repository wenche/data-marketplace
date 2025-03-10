/* eslint-disable camelcase */
/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Button, Divider, Icon, Typography,
} from "@equinor/eds-core-react"
import { shopping_cart_add } from "@equinor/eds-icons"
import { tokens } from "@equinor/eds-tokens"
import type { NextPage } from "next"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { useCallback, useEffect, useState } from "react"
import { useIntl, FormattedMessage, IntlShape } from "react-intl"
import { useDispatch } from "react-redux"
import styled from "styled-components"

import { AssetTabContent } from "../../components/AssetTabContent"
import { AssetTabs } from "../../components/AssetTabContent/types"
import { Container } from "../../components/Container"
import { HttpClient } from "../../lib/HttpClient"
import { Dispatch } from "../../store"

const Header = styled.header`
  display: grid;
  grid-template-columns: 1fr auto;
  grid-gap: 1.5rem;
  align-items: baseline;
`

const ContentContainer = styled.div`
  display: grid;
  grid-template-columns: minmax(10rem, 13rem) 1fr;
  grid-gap: 1.5rem;
`

const TabNavContainer = styled.aside`
  ul {
    padding: 0;
    margin: 0;
    list-style: none;

    li {
      position: relative;
      left: -0.75rem;
    }
  }
`

const getTabs = (intl: IntlShape) => ([
  {
    getDataSrc: (assetID: string) => `/api/assets/${assetID}/overview`,
    hash: "#overview",
    key: "overview",
    label: intl.formatMessage({ id: "asset.overview" }),
  },
  {
    getDataSrc: (assetID: string) => `/api/assets/${assetID}/responsibilities`,
    hash: "#responsibilities",
    key: "responsibilities",
    label: intl.formatMessage({ id: "asset.responsibilites" }),
  },
])

const TabLink = styled.a<{ isActive: boolean }>`
  padding: 0.5rem 0.75rem calc(0.5rem + 1px);
  display: inline-block;
  border-radius: ${tokens.shape.button.borderRadius};
  background-color: ${({ isActive }) => (isActive ? tokens.colors.interactive.secondary__highlight.hex : "transparent")};

  &:hover {
    background-color: ${tokens.colors.interactive.secondary__highlight.hex};
  }
`

const AssetDetailView: NextPage = () => {
  const router = useRouter()
  const intl = useIntl()
  const dispatch = useDispatch<Dispatch>()

  const tabs = getTabs(intl)

  const [currentTab, setCurrentTab] = useState<typeof tabs[0]>()
  const [assetData, setAssetData] = useState<any>()
  const [tabData, setTabData] = useState<any>()

  const assetId = router.query.id || ""

  useEffect(() => {
    if (router.query.id) {
      if (!window.location.hash) {
        router.replace("#overview")
      }

      if (!assetData) {
        (async () => {
          try {
            const res = await HttpClient.get(`/api/assets/${router.query.id}`, {
              headers: { authorization: `Bearer ${window.localStorage.getItem("access_token")}` },
            })
            setAssetData(res.body)
          } catch (error) {
            console.error(`[AssetDetailView] Failed while getting asset ${router.query.id}`, error)
          }
        })()
      }

      setCurrentTab(tabs.find((tab) => tab.hash === window.location.hash))
    }
  }, [assetData, router])

  useEffect(() => {
    if (currentTab && router.query.id) {
      (async () => {
        try {
          const res = await HttpClient.get(currentTab.getDataSrc(router.query.id as string), {
            headers: { authorization: `Bearer ${window.localStorage.getItem("access_token")}` },
          })
          setTabData(res.body)
        } catch (error) {
          console.error("[AssetDetailView] Failed while getting asset", router.query.id)
        }
      })()
    }
  }, [currentTab, router])

  const mapTabKeyToEnum = useCallback((tab: string) => ({
    overview: AssetTabs.Overview,
    responsibilities: AssetTabs.Responsibilities,
  })[tab], [])

  const generalDocumentTitle = intl.formatMessage({ id: "common.documentTitle" })
  const handleAddToCart = () => {
    dispatch.checkout.addToCart(assetId as string)
  }

  return (
    <main>
      <Head>
        <title>{assetData?.name ?? generalDocumentTitle}</title>
      </Head>

      <Container>
        <Header>
          {assetData && (
            <>
              <Typography variant="h1_bold" as="h1">
                {assetData.name}
              </Typography>

              <Button onClick={handleAddToCart}>
                <Icon data={shopping_cart_add} />
                <FormattedMessage id="asset.addToCart" />
              </Button>
            </>
          )}
        </Header>

        <Divider />

        <ContentContainer>
          <TabNavContainer>
            <nav>
              <ul>
                {tabs.map((tab) => (
                  <li key={tab.key}>
                    <Link href={tab.hash} passHref>
                      <TabLink isActive={currentTab?.hash === tab.hash}>
                        {tab.label}
                      </TabLink>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </TabNavContainer>

          <AssetTabContent tab={mapTabKeyToEnum(currentTab?.key!)!} data={tabData} />
        </ContentContainer>
      </Container>
    </main>
  )
}

export default AssetDetailView
