import { IntlMessageKey } from 'extension/common/intl/intl-message-key';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextOptions } from 'extension/template/context/template-context-options.model';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { YourlsAuthenticationMode } from 'extension/url-shortener/provider/yourls-authentication-mode.enum';

/**
 * Documents every option exposed by the `options` collection entry.
 *
 * The shape is derived from {@link TemplateContextOptions} itself, so the compiler guarantees this documentation
 * cannot drift from `buildOptions()`: every option must be documented, an option that does not exist cannot be
 * documented, and each `dataType` must match the option's actual type.
 */
export type TemplateContextOptionsDocumentation = OptionsDocumentation<TemplateContextOptions>;

type OptionsDocumentation<T> = {
  readonly [K in keyof T]-?: NonNullable<T[K]> extends object
    ? OptionBranchDocumentation<NonNullable<T[K]>>
    : OptionLeafDocumentation<NonNullable<T[K]>>;
};

type OptionBranchDocumentation<T> = {
  readonly descriptionKey: IntlMessageKey;
  readonly properties: OptionsDocumentation<T>;
};

type OptionLeafDocumentation<V> = {
  readonly dataType: V extends boolean
    ? TemplateContextDataType.Boolean
    : V extends number
      ? TemplateContextDataType.Number
      : TemplateContextDataType.String;
  readonly descriptionKey: IntlMessageKey;
  /** Indicates the value is a credential, so that the guide can warn against exposing it. */
  readonly sensitive?: boolean;
  /** The complete set of values the option can hold. */
  readonly values?: readonly V[];
};

export const optionsDocumentation: TemplateContextOptionsDocumentation = {
  notifications: {
    descriptionKey: 'context_options_notifications_description',
    properties: {
      enabled: {
        dataType: TemplateContextDataType.Boolean,
        descriptionKey: 'context_options_notifications_enabled_description',
      },
    },
  },
  templates: {
    descriptionKey: 'context_options_templates_description',
    properties: {
      action: {
        descriptionKey: 'context_options_templates_action_description',
        properties: {
          mode: {
            dataType: TemplateContextDataType.String,
            descriptionKey: 'context_options_templates_action_mode_description',
            values: [TemplateActionMode.Popup, TemplateActionMode.Template],
          },
          popup: {
            descriptionKey: 'context_options_templates_action_popup_description',
            properties: {
              autoCloseEnabled: {
                dataType: TemplateContextDataType.Boolean,
                descriptionKey: 'context_options_templates_action_popup_auto_close_enabled_description',
              },
              optionLinkEnabled: {
                dataType: TemplateContextDataType.Boolean,
                descriptionKey: 'context_options_templates_action_popup_option_link_enabled_description',
              },
            },
          },
          templateId: {
            dataType: TemplateContextDataType.String,
            descriptionKey: 'context_options_templates_action_template_id_description',
          },
        },
      },
      contextMenu: {
        descriptionKey: 'context_options_templates_context_menu_description',
        properties: {
          autoPasteEnabled: {
            dataType: TemplateContextDataType.Boolean,
            descriptionKey: 'context_options_templates_context_menu_auto_paste_enabled_description',
          },
          enabled: {
            dataType: TemplateContextDataType.Boolean,
            descriptionKey: 'context_options_templates_context_menu_enabled_description',
          },
          mode: {
            dataType: TemplateContextDataType.String,
            descriptionKey: 'context_options_templates_context_menu_mode_description',
            values: [TemplateContextMenuMode.Menu, TemplateContextMenuMode.Template],
          },
          optionLinkEnabled: {
            dataType: TemplateContextDataType.Boolean,
            descriptionKey: 'context_options_templates_context_menu_option_link_enabled_description',
          },
        },
      },
      links: {
        descriptionKey: 'context_options_templates_links_description',
        properties: {
          target: {
            dataType: TemplateContextDataType.Boolean,
            descriptionKey: 'context_options_templates_links_target_description',
          },
          title: {
            dataType: TemplateContextDataType.Boolean,
            descriptionKey: 'context_options_templates_links_title_description',
          },
        },
      },
      markdown: {
        descriptionKey: 'context_options_templates_markdown_description',
        properties: {
          inline: {
            dataType: TemplateContextDataType.Boolean,
            descriptionKey: 'context_options_templates_markdown_inline_description',
          },
        },
      },
      shortcuts: {
        descriptionKey: 'context_options_templates_shortcuts_description',
        properties: {
          autoPasteEnabled: {
            dataType: TemplateContextDataType.Boolean,
            descriptionKey: 'context_options_templates_shortcuts_auto_paste_enabled_description',
          },
          enabled: {
            dataType: TemplateContextDataType.Boolean,
            descriptionKey: 'context_options_templates_shortcuts_enabled_description',
          },
        },
      },
    },
  },
  urlShorteners: {
    descriptionKey: 'context_options_url_shorteners_description',
    properties: {
      bitly: {
        descriptionKey: 'context_options_url_shorteners_bitly_description',
        properties: {
          auth: {
            descriptionKey: 'context_options_url_shorteners_bitly_auth_description',
            properties: {
              authenticated: {
                dataType: TemplateContextDataType.Boolean,
                descriptionKey: 'context_options_url_shorteners_bitly_auth_authenticated_description',
              },
              principal: {
                dataType: TemplateContextDataType.String,
                descriptionKey: 'context_options_url_shorteners_bitly_auth_principal_description',
              },
            },
          },
        },
      },
      dagd: {
        descriptionKey: 'context_options_url_shorteners_dagd_description',
        properties: {},
      },
      provider: {
        dataType: TemplateContextDataType.String,
        descriptionKey: 'context_options_url_shorteners_provider_description',
        values: [
          UrlShortenerProviderName.Bitly,
          UrlShortenerProviderName.DaGd,
          UrlShortenerProviderName.SpooMe,
          UrlShortenerProviderName.Yourls,
        ],
      },
      spoome: {
        descriptionKey: 'context_options_url_shorteners_spoome_description',
        properties: {},
      },
      yourls: {
        descriptionKey: 'context_options_url_shorteners_yourls_description',
        properties: {
          auth: {
            descriptionKey: 'context_options_url_shorteners_yourls_auth_description',
            properties: {
              mode: {
                dataType: TemplateContextDataType.String,
                descriptionKey: 'context_options_url_shorteners_yourls_auth_mode_description',
                values: [YourlsAuthenticationMode.Advanced, YourlsAuthenticationMode.Basic],
              },
              password: {
                dataType: TemplateContextDataType.String,
                descriptionKey: 'context_options_url_shorteners_yourls_auth_password_description',
                sensitive: true,
              },
              signature: {
                dataType: TemplateContextDataType.String,
                descriptionKey: 'context_options_url_shorteners_yourls_auth_signature_description',
                sensitive: true,
              },
              username: {
                dataType: TemplateContextDataType.String,
                descriptionKey: 'context_options_url_shorteners_yourls_auth_username_description',
                sensitive: true,
              },
            },
          },
          url: {
            dataType: TemplateContextDataType.String,
            descriptionKey: 'context_options_url_shorteners_yourls_url_description',
          },
        },
      },
    },
  },
};
