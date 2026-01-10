#!/usr/bin/env python3
"""Database setup and management script."""
import asyncio
import sys
import os

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.db.init_db import init_database, reset_database, create_sample_analytics_data
from app.db.migrations import MigrationRunner
from app.db.backup import DatabaseBackup
from app.db.health_check import DatabaseHealthCheck


async def main():
    """Main CLI interface."""
    if len(sys.argv) < 2:
        print("Database Management Tool")
        print("=" * 50)
        print("Usage: python db_setup.py <command> [options]")
        print()
        print("Commands:")
        print("  init                     - Initialize database with indexes and seed data")
        print("  reset                    - Reset database (WARNING: Deletes all data)")
        print("  migrate up [version]     - Apply migrations")
        print("  migrate down <version>   - Rollback migrations")
        print("  migrate status           - Show migration status")
        print("  backup [name]            - Create database backup")
        print("  restore <path> [--drop]  - Restore from backup")
        print("  health                   - Run health check")
        print("  analytics                - Create sample analytics data")
        print()
        print("Examples:")
        print("  python db_setup.py init")
        print("  python db_setup.py backup production_backup")
        print("  python db_setup.py migrate up")
        print("  python db_setup.py health")
        return
    
    command = sys.argv[1]
    
    try:
        if command == "init":
            await init_database()
        
        elif command == "reset":
            await reset_database()
        
        elif command == "migrate":
            if len(sys.argv) < 3:
                print("Migrate subcommand required: up, down, or status")
                return
            
            subcommand = sys.argv[2]
            runner = MigrationRunner()
            
            if subcommand == "up":
                target = sys.argv[3] if len(sys.argv) > 3 else None
                await runner.migrate_up(target)
            elif subcommand == "down":
                if len(sys.argv) < 4:
                    print("Target version required for rollback")
                    return
                target = sys.argv[3]
                await runner.migrate_down(target)
            elif subcommand == "status":
                await runner.status()
            else:
                print(f"Unknown migrate subcommand: {subcommand}")
        
        elif command == "backup":
            backup_util = DatabaseBackup()
            name = sys.argv[2] if len(sys.argv) > 2 else None
            await backup_util.create_backup(name)
        
        elif command == "restore":
            if len(sys.argv) < 3:
                print("Backup path required")
                return
            backup_util = DatabaseBackup()
            path = sys.argv[2]
            drop = "--drop" in sys.argv
            await backup_util.restore_backup(path, drop)
        
        elif command == "health":
            health_checker = DatabaseHealthCheck()
            result = await health_checker.full_health_check()
            
            print("\nDatabase Health Report")
            print("=" * 50)
            print(f"Overall Status: {result['overall_status'].upper()}")
            print(f"Timestamp: {result['timestamp']}")
            
            # Connection
            conn = result['connection']
            print(f"\n🔗 Connection: {conn['status'].upper()}")
            
            # Collections
            print(f"\n📊 Collections:")
            for name, info in result['collections'].items():
                print(f"  {name}: {info['document_count']} docs, {info['size_mb']} MB, {info['index_count']} indexes")
            
            # Data integrity
            integrity = result['data_integrity']
            if integrity['issues_found'] > 0:
                print(f"\n⚠️  Data Integrity Issues: {integrity['issues_found']}")
                for issue in integrity['issues'][:5]:  # Show first 5 issues
                    print(f"  - {issue['type']}: {issue}")
            else:
                print(f"\n✅ Data Integrity: No issues found")
            
            # Recent activity
            activity = result['recent_activity']
            print(f"\n📈 Recent Activity (24h):")
            print(f"  New listings: {activity['new_listings']}")
            print(f"  New leads: {activity['new_leads']}")
            print(f"  Analytics events: {activity['analytics_events']}")
            print(f"  New partners: {activity['new_partners']}")
        
        elif command == "analytics":
            await create_sample_analytics_data()
        
        else:
            print(f"Unknown command: {command}")
            print("Use 'python db_setup.py' to see available commands")
    
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())