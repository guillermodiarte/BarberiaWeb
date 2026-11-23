package com.barbershop.crm.core.database.dao;

import android.database.Cursor;
import androidx.annotation.NonNull;
import androidx.room.CoroutinesRoom;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.SharedSQLiteStatement;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.barbershop.crm.core.database.entities.BarberEntity;
import java.lang.Class;
import java.lang.Double;
import java.lang.Exception;
import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import javax.annotation.processing.Generated;
import kotlin.Unit;
import kotlin.coroutines.Continuation;
import kotlinx.coroutines.flow.Flow;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class BarberDao_Impl implements BarberDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<BarberEntity> __insertionAdapterOfBarberEntity;

  private final SharedSQLiteStatement __preparedStmtOfClearAll;

  public BarberDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfBarberEntity = new EntityInsertionAdapter<BarberEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `barbers` (`id`,`fullName`,`email`,`phone`,`role`,`isActive`,`commissionPercentage`,`fixedRentAmount`) VALUES (?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final BarberEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindString(2, entity.getFullName());
        statement.bindString(3, entity.getEmail());
        if (entity.getPhone() == null) {
          statement.bindNull(4);
        } else {
          statement.bindString(4, entity.getPhone());
        }
        statement.bindString(5, entity.getRole());
        final int _tmp = entity.isActive() ? 1 : 0;
        statement.bindLong(6, _tmp);
        if (entity.getCommissionPercentage() == null) {
          statement.bindNull(7);
        } else {
          statement.bindDouble(7, entity.getCommissionPercentage());
        }
        if (entity.getFixedRentAmount() == null) {
          statement.bindNull(8);
        } else {
          statement.bindDouble(8, entity.getFixedRentAmount());
        }
      }
    };
    this.__preparedStmtOfClearAll = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM barbers";
        return _query;
      }
    };
  }

  @Override
  public Object insertAll(final List<BarberEntity> barbers,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfBarberEntity.insert(barbers);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object clearAll(final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfClearAll.acquire();
        try {
          __db.beginTransaction();
          try {
            _stmt.executeUpdateDelete();
            __db.setTransactionSuccessful();
            return Unit.INSTANCE;
          } finally {
            __db.endTransaction();
          }
        } finally {
          __preparedStmtOfClearAll.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<BarberEntity>> getAllBarbers() {
    final String _sql = "SELECT * FROM barbers ORDER BY fullName ASC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"barbers"}, new Callable<List<BarberEntity>>() {
      @Override
      @NonNull
      public List<BarberEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfFullName = CursorUtil.getColumnIndexOrThrow(_cursor, "fullName");
          final int _cursorIndexOfEmail = CursorUtil.getColumnIndexOrThrow(_cursor, "email");
          final int _cursorIndexOfPhone = CursorUtil.getColumnIndexOrThrow(_cursor, "phone");
          final int _cursorIndexOfRole = CursorUtil.getColumnIndexOrThrow(_cursor, "role");
          final int _cursorIndexOfIsActive = CursorUtil.getColumnIndexOrThrow(_cursor, "isActive");
          final int _cursorIndexOfCommissionPercentage = CursorUtil.getColumnIndexOrThrow(_cursor, "commissionPercentage");
          final int _cursorIndexOfFixedRentAmount = CursorUtil.getColumnIndexOrThrow(_cursor, "fixedRentAmount");
          final List<BarberEntity> _result = new ArrayList<BarberEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final BarberEntity _item;
            final int _tmpId;
            _tmpId = _cursor.getInt(_cursorIndexOfId);
            final String _tmpFullName;
            _tmpFullName = _cursor.getString(_cursorIndexOfFullName);
            final String _tmpEmail;
            _tmpEmail = _cursor.getString(_cursorIndexOfEmail);
            final String _tmpPhone;
            if (_cursor.isNull(_cursorIndexOfPhone)) {
              _tmpPhone = null;
            } else {
              _tmpPhone = _cursor.getString(_cursorIndexOfPhone);
            }
            final String _tmpRole;
            _tmpRole = _cursor.getString(_cursorIndexOfRole);
            final boolean _tmpIsActive;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsActive);
            _tmpIsActive = _tmp != 0;
            final Double _tmpCommissionPercentage;
            if (_cursor.isNull(_cursorIndexOfCommissionPercentage)) {
              _tmpCommissionPercentage = null;
            } else {
              _tmpCommissionPercentage = _cursor.getDouble(_cursorIndexOfCommissionPercentage);
            }
            final Double _tmpFixedRentAmount;
            if (_cursor.isNull(_cursorIndexOfFixedRentAmount)) {
              _tmpFixedRentAmount = null;
            } else {
              _tmpFixedRentAmount = _cursor.getDouble(_cursorIndexOfFixedRentAmount);
            }
            _item = new BarberEntity(_tmpId,_tmpFullName,_tmpEmail,_tmpPhone,_tmpRole,_tmpIsActive,_tmpCommissionPercentage,_tmpFixedRentAmount);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
