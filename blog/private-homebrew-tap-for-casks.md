---
title: "Building a private Caskroom for your most precious Homebrews"
date: 2025-08-09
categories: [programming]
---

<aside>

**TL;DR:** Download [my custom strategy](https://gist.github.com/moltinginstar/49d162d8041133cf8ffe76c5f022aa82) and `require` it in your casks using an absolute path.

</aside>

It’s 2025, and for some reason, Homebrew still doesn’t let you download casks from private GitHub repositories.

I use Homebrew to manage everything from packages to apps to fonts, so this is a rather unfortunate omission. When 99% of the tools I need I can get through a neat CLI, the occasional direct download becomes impossible to stomach.

In particular, I have a growing collection of free-for-personal-use fonts that so far I’ve had to install manually every time I’ve set up a Mac. By contrast, installing open-source ones is now as simple as listing them out in my `nix-darwin` config:

<figure>

```nix
{
  ...

  homebrew = {
    casks = [
      "font-iosevka"
      "font-iosevka-ss14"
      "font-latin-modern"
      ...
    ];
  };

  ...
};
```

  <figcaption>

  `configuration.nix`

  </figcaption>
</figure>

Using casks to manage fonts has the extra benefit of keeping them up to date, which makes a difference when your [favorite monospace font](https://typeof.net/Iosevka/) has a [biweekly (!) release cadence](https://github.com/be5invis/Iosevka/releases).

I knew there had to be a way to make Homebrew play nice with private repos; at any rate, I’m not one to back down from a challenge. When the universe hands you the chance to spend an entire weekend automating something you’ll need exactly once, you take it, or you pack your bags.

## Coming up with a plan

A cask is a Ruby script that tells Homebrew how to obtain an asset and what to do with it. For a font, that looks like this:

<figure>

```ruby
cask "font-iosevka" do
  version "33.2.6"
  sha256 "cdc5d97f4a417658ec24b85cb35621a79451a366afa28619b613e64d8f605cd9"

  url "https://github.com/be5invis/Iosevka/releases/download/v#{version}/SuperTTC-Iosevka-#{version}.zip"
  name "Iosevka"
  homepage "https://github.com/be5invis/Iosevka/"

  livecheck do
    url :url
    strategy :github_latest
  end

  font "Iosevka.ttc"

  # No zap stanza required
end
```

  <figcaption>

  [`font-iosevka.rb`](https://github.com/Homebrew/homebrew-cask/blob/bae2dae885a1a559acefcba3003d812498262b7c/Casks/font/font-i/font-iosevka.rb)

  </figcaption>
</figure>

The `url` line (or “stanza”) instructs Homebrew to download (and [recursively unzip](https://github.com/Homebrew/brew/blob/700d67a85e0129ab8a893ff69246943479e33df1/Library/Homebrew/download_strategy.rb#L119)) `SuperTTC-Iosevka-33.2.6.zip` from its (public) GitHub release, and `font` [moves](https://docs.brew.sh/Cask-Cookbook#at-least-one-artifact-stanza-is-also-required) the extracted font file to `~/Library/Fonts`.

Homebrew can handle different types of URLs through its various built-in download strategies. By default, it uses simple heuristics to select the strategy:

<figure>

```ruby
class DownloadStrategyDetector
  ...

  def self.detect_from_url(url)
    case url
      when GitHubPackages::URL_REGEX
        CurlGitHubPackagesDownloadStrategy
      when %r{^https?://github\.com/[^/]+/[^/]+\.git$}
        GitHubGitDownloadStrategy
      when %r{^https?://.+\.git$},
           %r{^git://},
           %r{^https?://git\.sr\.ht/[^/]+/[^/]+$},
           %r{^ssh://git}
        GitDownloadStrategy
      when %r{^https?://www\.apache\.org/dyn/closer\.cgi},
           %r{^https?://www\.apache\.org/dyn/closer\.lua}
        CurlApacheMirrorDownloadStrategy
      when %r{^https?://([A-Za-z0-9\-.]+\.)?googlecode\.com/svn},
           %r{^https?://svn\.},
           %r{^svn://},
           %r{^svn\+http://},
           %r{^http://svn\.apache\.org/repos/},
           %r{^https?://([A-Za-z0-9\-.]+\.)?sourceforge\.net/svnroot/}
        SubversionDownloadStrategy
      when %r{^cvs://}
        CVSDownloadStrategy
      when %r{^hg://},
           %r{^https?://([A-Za-z0-9\-.]+\.)?googlecode\.com/hg},
           %r{^https?://([A-Za-z0-9\-.]+\.)?sourceforge\.net/hgweb/}
        MercurialDownloadStrategy
      when %r{^bzr://}
        BazaarDownloadStrategy
      when %r{^fossil://}
        FossilDownloadStrategy
      else
        CurlDownloadStrategy
      end
    end

  ...
end
```

  <figcaption>

  [`Homebrew/brew/Library/Homebrew/download_strategy.rb`](https://github.com/Homebrew/brew/blob/dbe68ef80ce1faefddddbade2029c610c6fba3f4/Library/Homebrew/download_strategy.rb#L1618)

  </figcaption>
</figure>


The official documentation states that you can override the download strategy by explicitly [passing the appropriate symbol to the `using` parameter](https://docs.brew.sh/Cask-Cookbook#stanza-url):

```ruby
cask "font-fonty-mcfontface" do
  ...

  url "https://type-foundry.example.com/v1/api/font/fonty-mcfontface/download", using: :post # CurlPostDownloadStrategy

  ...
end
```

It turns out you can also pass a class name directly, and if you specify a custom class via an import, Homebrew will execute it the same way as any of the bundled strategies:

```ruby
require_relative "../lib/download_strategy"

cask "font-fonty-mcfontface" do
  ...

  url "https://github.com/moltinginstar/fonty-mcfontface.git", using: CustomDownloadStrategy

  ...
end
```

An obvious thing to try, then, is to extend the built-in GitHub strategy and add authentication. We’ll store our font files in a private monorepo and create another private repo (a “[tap](https://docs.brew.sh/Taps)”) to house our cask definitions and custom download strategy:

<figure>

```
.
├── Fonty McFontface
│   ├── LICENSE.pdf
│   ├── FontyMcFontface-Black.otf
│   ├── FontyMcFontface-Bold.otf
│   ├── FontyMcFontface-Medium.otf
│   ├── FontyMcFontface-Regular.otf
│   └── FontyMcFontface-Thin.otf
├── ...
├── Roboto
│   ├── LICENSE.pdf
│   └── Roboto.ttc
└── ...
```

  <figcaption>

  `moltinginstar/fonts`

  </figcaption>
</figure>

We’ll place the download strategy in a subdirectory of the tap rather than the root since [Homebrew may interpret root-level files as formulae](https://docs.brew.sh/How-to-Create-and-Maintain-a-Tap#creating-a-tap):

<figure>

```
.
├── Casks # Must be a top-level folder named Casks
│   ├── font-fonty-mcfontface.rb
│   ├── ...
│   ├── font-roboto.rb
│   └── ...
├── lib
│   └── download_strategy.rb
└── LICENSE
```

  <figcaption>

  `moltinginstar/homebrew-tap`

  </figcaption>
</figure>

This will allow us to install fonts like this:

```bash
brew tap moltinginstar/tap
brew install font-fonty-mcfontface
brew install --cask moltinginstar/tap/font-roboto # Name conflict with existing core package
...
```

To avoid downloading the entire repository inside each cask, we will use [sparse checkouts](https://git-scm.com/docs/git-sparse-checkout), which `(GitHub)GitDownloadStrategy` already implements via the [`only_path`](https://docs.brew.sh/Formula-Cookbook#unstable-versions-head) option ([example cask](https://github.com/Homebrew/homebrew-cask/blob/509009ba0016043080ca95f0d71969fed18be682/Casks/font/font-f/font-fira-mono.rb)). That means we only have to worry about authentication.

## Authenticating to GitHub

One way is to set the [`HOMEBREW_GITHUB_API_TOKEN`](https://docs.brew.sh/Manpage#:~:text=HOMEBREW_GITHUB_API_TOKEN) environment variable—used internally for increased API rate limits—and retrieve it in the downloader script using Ruby’s [`ENV` accessor](https://docs.ruby-lang.org/en/master/ENV.html). But I wanted to use the [GitHub CLI](https://cli.github.com/) to authenticate rather than manage yet another access token.

After combing the Homebrew codebase and documentation for clues, I found the solution. Homebrew already has an [internal GitHub API](https://rubydoc.brew.sh/GitHub/API.html) that comes with an ultra-convenient unified accessor method for authentication credentials:

<figure>

```ruby
module GitHub
  ...

  def self.credentials
    @credentials ||= T.let(nil, T.nilable(String))
    # 1. HOMEBREW_GITHUB_API_TOKEN or
    @credentials ||= Homebrew::EnvConfig.github_api_token.presence
    # 2. gh auth token or
    @credentials ||= github_cli_token
    # 3. git-credential-osxkeychain
    @credentials ||= keychain_username_password
  end

  ...
end
```

  <figcaption>

  [`Homebrew/brew/Library/Homebrew/utils/github/api.rb`](https://github.com/Homebrew/brew/blob/dbe68ef80ce1faefddddbade2029c610c6fba3f4/Library/Homebrew/utils/github/api.rb#L200)

  </figcaption>
</figure>

All we have to do is override the clone URL in `GitHubGitDownloadStrategy` and inject the credentials via HTTP Basic authentication ([GitHub recommends `x-access-token` for the username](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation)):

<figure>

```ruby
require "utils/github/api"

module AuthenticatedGitHubUrl
  def authenticated_url(url)
    if GitHub::API.credentials
      url = url.sub("https://github.com/", "https://x-access-token:#{GitHub::API.credentials}@github.com/")
    end

    url
  end
end

# Clean implementation but exposes the token in the command line:
# ==> Cloning https://x-access-token:<token>@github.com/<user>/<repo>.git
# ...
class AuthenticatedGitHubGitDownloadStrategy_ < GitHubGitDownloadStrategy
  include AuthenticatedGitHubUrl

  def initialize(url, name, version, **config)
    super(authenticated_url(url), name, version, **config)
  end
end

# Duplicates some code but doesn't leak the token
class AuthenticatedGitHubGitDownloadStrategy < GitHubGitDownloadStrategy
  include AuthenticatedGitHubUrl

  def clone_args
    args = super

    url_index = args.find_index(@url)
    if url_index && @url.start_with?("https://github.com/")
      args[url_index] = authenticated_url(@url)
    end

    args
  end

  def update_repo(timeout: nil)
    return if @ref_type != :branch && ref?

    if shallow_dir?
      command! "git",
               args:    ["fetch", authenticated_url(@url), "--unshallow"],
               chdir:   cached_location,
               timeout: Utils::Timer.remaining(timeout),
               secrets: [GitHub::API.credentials]
    else
      command! "git",
               args:    ["fetch", authenticated_url(@url)],
               chdir:   cached_location,
               timeout: Utils::Timer.remaining(timeout),
               secrets: [GitHub::API.credentials]
    end
  end
end
```

  <figcaption>

  [`moltinginstar/homebrew-tap/lib/download_strategy.rb`](https://gist.github.com/moltinginstar/49d162d8041133cf8ffe76c5f022aa82)

  </figcaption>
</figure>

<figure>

```ruby
require_relative "../lib/download_strategy"

cask "font-fonty-mcfontface" do
  version :latest
  sha256 :no_check

  url "https://github.com/moltinginstar/fonts.git",
    using: AuthenticatedGitHubGitDownloadStrategy,
    branch: "main",
    only_path: "Fonty McFontface"
  name "Fonty McFontface"
  homepage "https://type-foundry.example.com/fonty-mcfontface"

  font "FontyMcFontface-Black.otf"
  font "FontyMcFontface-Bold.otf"
  font "FontyMcFontface-Medium.otf"
  font "FontyMcFontface-Regular.otf"
  font "FontyMcFontface-Thin.otf"
end
```

  <figcaption>

  `moltinginstar/homebrew-tap/Casks/font-fonty-mcfontface.rb`

  </figcaption>
</figure>

If you now run `gh auth login` followed by `brew install`, Homebrew will pick up the saved GitHub token automatically and voilà, Fonty McFontface is yours.

## Fixing `brew upgrade`

When you try to upgrade the cask, however, you’ll be faced with a cryptic error:

```
Error: Cask 'font-fonty-mcfontface' is unreadable: cannot load such file -- /opt/homebrew/Caskroom/fonty-mcfontface/.metadata/latest/20250808004203.141/lib/download_strategy
```

This is because the first time Homebrew downloads a cask, it caches the cask file under `/opt/homebrew/Caskroom/<cask>/.metadata/<version>/<datetime>/` and attempts to use it during subsequent operations, including upgrades and uninstalls. However, the download strategy is not copied over, rendering the cask invalid.

We can fix this by replacing the relative import with an absolute import from the tap itself. When you tap a repository, Homebrew clones it to `/opt/homebrew/Library/Taps/<your>/<private-tap>`.[^1] That means we can simply change

```ruby
require_relative "../lib/download_strategy"
```

to

```ruby
require "/opt/homebrew/Library/Taps/#{YOUR}/#{PRIVATE_TAP}/lib/download_strategy.rb"
```

in all of our casks, and we’ll be able to use `brew upgrade` and `brew uninstall` as before.

## Putting on the finishing touches

To keep things DRY with multiple private repositories, you could put `download_strategy.rb` in a shared folder on your system, and add an environment variable pointing to it:[^2]

<figure>

```bash
...

export HOMEBREW_CUSTOM_DOWNLOAD_STRATEGY="${PATH_TO}/download_strategy.rb"

...
```

  <figcaption>

  `~/.zshenv`

  </figcaption>
</figure>

In your cask files you would use:

```ruby
require ENV.fetch("HOMEBREW_CUSTOM_DOWNLOAD_STRATEGY")
```

And that’s it. The same approach works for any private assets, not just fonts. [Apps, dictionaries, keyboard layouts, `zsh` completions](https://docs.brew.sh/Cask-Cookbook#at-least-one-artifact-stanza-is-also-required)—if you can cask it, you can now serve it.

[^1]: On Intel Macs, taps are usually installed in `/usr/local/Library/Taps` or `/usr/local/Homebrew/Library/Taps`. You can run `brew --repository <your>/<private-tap>` to get the exact path for your system.

[^2]: In some setups (e.g., with `nix-darwin`), you may need to set the environment variable in your Brewfile as well:

    ```ruby
    module Utils
     ENV["HOMEBREW_CUSTOM_DOWNLOAD_STRATEGY"] = "#{PATH_TO}/download_strategy.rb";
    end
    ```
