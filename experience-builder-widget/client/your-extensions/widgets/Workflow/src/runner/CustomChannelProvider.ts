import esriRequest from '@arcgis/core/request'
import type EsriError from '@arcgis/core/core/Error'
import type { RequestErrorDetails, RequestOptions, RequestResponse } from '@arcgis/core/request/types'
import { ChannelProvider } from '@vertigis/workflow/activities/core/ChannelProvider'
import { jsonToQueryObject } from '@vertigis/workflow/activities/core/converters'
import { type Engine } from '@vertigis/workflow/execution/Engine'

export function register(engine: Engine) {
  // We do this inline to prevent tampering.
  class CustomChannelProvider extends ChannelProvider {
    succeed(payload: RequestResponse<any>) {
      this.response.content = payload.data
      this.response.payload = payload
      this.response.status = payload.httpStatus
      this.resolve(true)
    }

    fail(error: EsriError) {
      this.response.error = error
      this.response.status = (error.details as RequestErrorDetails)?.httpStatus
      this.resolve(false)
    }

    sendThroughArcGIS(): Promise<boolean> {
      const options: RequestOptions = {
        query: jsonToQueryObject(this.request.json),
        responseType: 'json', // We only support JSON.
        // In the designer we suggest "GET" and "POST" but the 4.x API expects lower-case.
        method: this.request.method?.toLowerCase() as RequestOptions['method'],
        timeout: this.timeout
      }

      if (this.request.content instanceof FormData) {
        options.body = this.request.content
      }

      const resolverPromise = this.basePromise

      const abortController = new AbortController()
      // Calling `cancel()` on the channel will abort the Esri Request.
      resolverPromise.finally(() => {
        abortController.abort()
      })
      options.signal = abortController.signal

      const promise = esriRequest(this.request.url, options)
      promise.then(
        x => {
          this.succeed(x)
        },
        x => {
          this.fail(x)
        }
      )

      return resolverPromise
    }

    send() {
      // Allow this to be called twice, but only initiate once.
      if (this.promise !== undefined) {
        return this.promise
      }

      // We want to delegate to the arcgis infrastructure, so use that.
      if (this.name === 'arcgis') {
        return (this.promise = this.sendThroughArcGIS())
      }

      if (this.name === 'geocortex') {
        return (this.promise = this.sendThroughArcGIS())
      }

      // We want to use the default behavior, so do that.
      return super.send()
    }

    getResponseData(payload) {
      return payload.data
    }
  }

  CustomChannelProvider.register(engine.activator)
}
