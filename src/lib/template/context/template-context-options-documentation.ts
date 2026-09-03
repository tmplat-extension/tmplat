import { type IntlMessageKey } from 'extension/common/intl/intl-message-key';
import { VersionSegment } from 'extension/common/version/version-segment.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { type TemplateContextOptions } from 'extension/template/context/template-context-options.model';
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
    descriptionKey: 'option_notifications',
    properties: {
      changelog: {
        descriptionKey: 'option_notifications_changelog',
        properties: {
          enabled: {
            dataType: TemplateContextDataType.Boolean,
            descriptionKey: 'option_notifications_changelog_enabled',
          },
          scope: {
            dataType: TemplateContextDataType.String,
            descriptionKey: 'option_notifications_changelog_scope',
            values: [VersionSegment.Major, VersionSegment.Minor, VersionSegment.Patch],
          },
        },
      },
      enabled: {
        dataType: TemplateContextDataType.Boolean,
        descriptionKey: 'option_notifications_enabled',
      },
    },
  },
  templates: {
    descriptionKey: 'option_templates',
    properties: {
      action: {
        descriptionKey: 'option_templates_action',
        properties: {
          mode: {
            dataType: TemplateContextDataType.String,
            descriptionKey: 'option_templates_action_mode',
            values: [TemplateActionMode.Popup, TemplateActionMode.Template],
          },
          popup: {
            descriptionKey: 'option_templates_action_popup',
            properties: {
              autoCloseEnabled: {
                dataType: TemplateContextDataType.Boolean,
                descriptionKey: 'option_templates_action_popup_auto_close_enabled',
              },
              optionLinkEnabled: {
                dataType: TemplateContextDataType.Boolean,
                descriptionKey: 'option_templates_action_popup_option_link_enabled',
              },
            },
          },
          templateId: {
            dataType: TemplateContextDataType.String,
            descriptionKey: 'option_templates_action_template_id',
          },
        },
      },
      contextMenu: {
        descriptionKey: 'option_templates_context_menu',
        properties: {
          autoPasteEnabled: {
            dataType: TemplateContextDataType.Boolean,
            descriptionKey: 'option_templates_context_menu_auto_paste_enabled',
          },
          enabled: {
            dataType: TemplateContextDataType.Boolean,
            descriptionKey: 'option_templates_context_menu_enabled',
          },
          mode: {
            dataType: TemplateContextDataType.String,
            descriptionKey: 'option_templates_context_menu_mode',
            values: [TemplateContextMenuMode.Menu, TemplateContextMenuMode.Template],
          },
          optionLinkEnabled: {
            dataType: TemplateContextDataType.Boolean,
            descriptionKey: 'option_templates_context_menu_option_link_enabled',
          },
          templateId: {
            dataType: TemplateContextDataType.String,
            descriptionKey: 'option_templates_context_menu_template_id',
          },
        },
      },
      links: {
        descriptionKey: 'option_templates_links',
        properties: {
          target: {
            dataType: TemplateContextDataType.Boolean,
            descriptionKey: 'option_templates_links_target',
          },
          title: {
            dataType: TemplateContextDataType.Boolean,
            descriptionKey: 'option_templates_links_title',
          },
        },
      },
      markdown: {
        descriptionKey: 'option_templates_markdown',
        properties: {
          inline: {
            dataType: TemplateContextDataType.Boolean,
            descriptionKey: 'option_templates_markdown_inline',
          },
        },
      },
      shortcuts: {
        descriptionKey: 'option_templates_shortcuts',
        properties: {
          autoPasteEnabled: {
            dataType: TemplateContextDataType.Boolean,
            descriptionKey: 'option_templates_shortcuts_auto_paste_enabled',
          },
          enabled: {
            dataType: TemplateContextDataType.Boolean,
            descriptionKey: 'option_templates_shortcuts_enabled',
          },
        },
      },
    },
  },
  urlShorteners: {
    descriptionKey: 'option_url_shorteners',
    properties: {
      dagd: {
        descriptionKey: 'option_url_shorteners_dagd',
        properties: {},
      },
      provider: {
        dataType: TemplateContextDataType.String,
        descriptionKey: 'option_url_shorteners_provider',
        values: [UrlShortenerProviderName.DaGd, UrlShortenerProviderName.SpooMe, UrlShortenerProviderName.Yourls],
      },
      spoome: {
        descriptionKey: 'option_url_shorteners_spoome',
        properties: {},
      },
      yourls: {
        descriptionKey: 'option_url_shorteners_yourls',
        properties: {
          auth: {
            descriptionKey: 'option_url_shorteners_yourls_auth',
            properties: {
              mode: {
                dataType: TemplateContextDataType.String,
                descriptionKey: 'option_url_shorteners_yourls_auth_mode',
                values: [YourlsAuthenticationMode.Advanced, YourlsAuthenticationMode.Basic],
              },
              password: {
                dataType: TemplateContextDataType.String,
                descriptionKey: 'option_url_shorteners_yourls_auth_password',
                sensitive: true,
              },
              signature: {
                dataType: TemplateContextDataType.String,
                descriptionKey: 'option_url_shorteners_yourls_auth_signature',
                sensitive: true,
              },
              username: {
                dataType: TemplateContextDataType.String,
                descriptionKey: 'option_url_shorteners_yourls_auth_username',
                sensitive: true,
              },
            },
          },
          url: {
            dataType: TemplateContextDataType.String,
            descriptionKey: 'option_url_shorteners_yourls_url',
          },
        },
      },
    },
  },
};
