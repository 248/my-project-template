# Atlas configuration for my-project-template
# This configuration enables using Atlas for database migrations while keeping Prisma for ORM functionality

# Generate schema from Prisma schema file
data "external_schema" "prisma" {
  program = [
    "pnpm", "--filter", "@template/backend", "exec", "prisma", "migrate", "diff",
    "--from-empty",
    "--to-schema-datamodel", "prisma/schema.prisma",
    "--script"
  ]
}

# Common configuration to avoid duplication
locals {
  schema = {
    src = data.external_schema.prisma.url
  }
  migration = {
    dir     = "file://atlas/migrations"
    exclude = ["_prisma_migrations"]
  }
}

# Development environment configuration
env "dev" {
  # Development database URL for schema comparison
  # Atlas uses this temporary database for schema diffing
  dev = "docker://postgres/16/dev?search_path=public"

  # Use Prisma-generated schema as the desired state
  schema {
    src = local.schema.src
  }

  # Atlas migration configuration
  migration {
    # Directory for Atlas-managed migrations
    dir = local.migration.dir

    # Exclude Prisma's migration table to avoid conflicts
    exclude = local.migration.exclude
  }

  # Formatting configuration
  format {
    migrate {
      diff = "{{ sql . \"  \" }}"
    }
  }
}

# Production environment configuration
env "prod" {
  # Production uses the actual DATABASE_URL
  url = getenv("DATABASE_URL")

  # Use same schema source as dev
  schema {
    src = local.schema.src
  }

  # Same migration configuration as dev
  migration {
    dir = local.migration.dir
    exclude = local.migration.exclude
  }

  # Production-specific settings
  diff {
    # Skip destructive changes in production by default
    skip {
      drop_schema = true
      drop_table  = true
    }
  }
}

# Staging environment (optional)
env "staging" {
  url = getenv("STAGING_DATABASE_URL")

  schema {
    src = local.schema.src
  }

  migration {
    dir = local.migration.dir
    exclude = local.migration.exclude
  }
}